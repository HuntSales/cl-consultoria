import * as React from "react";
import { render } from "@react-email/render";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { template as devolutivaTemplate } from "@/lib/email-templates/devolutiva-diagnostico";
import { calcularDistribuicaoPerfis, normalizarConteudoPerfil } from "@/lib/perfil-conteudo";


const SITE_NAME = "Cibele Lucena Consultoria Financeira";
const SENDER_DOMAIN = "notify.cl.corptraining.com.br";
const FROM_DOMAIN = "cl.corptraining.com.br";
const TEMPLATE_NAME = "devolutiva-diagnostico";

function gerarToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function baseUrl(): string {
  return (
    process.env["APP_BASE_URL"] ??
    process.env["VITE_APP_BASE_URL"] ??
    "https://cl.corptraining.com.br"
  ).replace(/\/$/, "");
}

/**
 * Renderiza e enfileira o e-mail de devolutiva para uma resposta de diagnóstico.
 * Nunca lança: retorna o motivo da falha para registro.
 */
export async function enfileirarDevolutiva(
  respostaId: string,
): Promise<{ ok: boolean; motivo?: string }> {
  const { data: resposta, error } = await supabaseAdmin
    .from("respostas_diagnostico")
    .select(
      "id, nome, email, diagnostico_id, diagnostico_titulo, score_percentual, perfil_id, perfil_titulo, perfil_descricao, dimensoes_resultado, diagnosticos(slug, link_agendamento)",
    )
    .eq("id", respostaId)
    .maybeSingle();

  if (error) return { ok: false, motivo: error.message };
  if (!resposta?.email) return { ok: false, motivo: "Resposta sem e-mail." };

  const destinatario = resposta.email.toLowerCase();
  const messageId = crypto.randomUUID();

  // Lista de supressão (fail-closed)
  const { data: suprimido, error: erroSupressao } = await supabaseAdmin
    .from("suppressed_emails")
    .select("id")
    .eq("email", destinatario)
    .maybeSingle();
  if (erroSupressao) return { ok: false, motivo: "Falha ao checar supressão." };
  if (suprimido) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: TEMPLATE_NAME,
      recipient_email: destinatario,
      status: "suppressed",
    });
    return { ok: false, motivo: "E-mail na lista de supressão." };
  }

  // Token de descadastro (um por endereço)
  let unsubscribeToken: string;
  const { data: tokenExistente } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", destinatario)
    .maybeSingle();

  if (tokenExistente?.token && !tokenExistente.used_at) {
    unsubscribeToken = tokenExistente.token;
  } else if (!tokenExistente) {
    unsubscribeToken = gerarToken();
    await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .upsert({ token: unsubscribeToken, email: destinatario }, { onConflict: "email", ignoreDuplicates: true });
    const { data: guardado } = await supabaseAdmin
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", destinatario)
      .maybeSingle();
    if (!guardado?.token) return { ok: false, motivo: "Falha ao criar token de descadastro." };
    unsubscribeToken = guardado.token;
  } else {
    return { ok: false, motivo: "Destinatário descadastrado." };
  }

  const dimensoesBrutas = Array.isArray(resposta.dimensoes_resultado)
    ? (resposta.dimensoes_resultado as unknown as {
        id: string;
        titulo: string;
        score: number;
        scoreMaximo: number;
        scorePercentual: number;
      }[])
    : [];
  const dimensoes = dimensoesBrutas.map((d) => ({
    titulo: d.titulo,
    scorePercentual: Number(d.scorePercentual) || 0,
  }));

  const { data: perfis } = await supabaseAdmin
    .from("perfis_resultado")
    .select("id, cor, dimensao_id, conteudo")
    .eq("diagnostico_id", resposta.diagnostico_id);
  const cores: Record<string, string | null> = {};
  for (const p of perfis ?? []) {
    if (p.dimensao_id) cores[p.dimensao_id] = p.cor;
  }
  const perfilAtual = (perfis ?? []).find((p) => p.id === resposta.perfil_id) ?? null;
  const distribuicao = calcularDistribuicaoPerfis(dimensoesBrutas, cores);
  const conteudoPerfil = normalizarConteudoPerfil(perfilAtual?.conteudo);

  const slug = resposta.diagnosticos?.slug ?? "";
  const templateData = {
    nome: resposta.nome,
    diagnosticoTitulo: resposta.diagnostico_titulo,
    scorePercentual: Number(resposta.score_percentual) || 0,
    perfilTitulo: resposta.perfil_titulo,
    perfilDescricao: resposta.perfil_descricao,
    dimensoes,
    distribuicao,
    conteudoPerfil,
    linkAgendamento: resposta.diagnosticos?.link_agendamento ?? null,
    linkResultado: slug ? `${baseUrl()}/d/${slug}/r/${resposta.id}` : "",
  };


  const element = React.createElement(devolutivaTemplate.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject = devolutivaTemplate.subject(templateData);

  await supabaseAdmin.from("email_send_log").insert({
    message_id: messageId,
    template_name: TEMPLATE_NAME,
    recipient_email: destinatario,
    status: "pending",
  });

  const { error: erroFila } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: destinatario,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: "transactional",
      label: TEMPLATE_NAME,
      idempotency_key: `devolutiva-${resposta.id}`,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  });

  if (erroFila) {
    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: TEMPLATE_NAME,
      recipient_email: destinatario,
      status: "failed",
      error_message: erroFila.message,
    });
    return { ok: false, motivo: erroFila.message };
  }

  return { ok: true };
}
