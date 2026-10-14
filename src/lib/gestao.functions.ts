import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { apenasDigitosCpf, cpfValido } from "@/lib/cpf";

export type ConfigAgente = {
  provedor: "openai" | "anthropic";
  modelo: string | null;
  temApiKey: boolean;
  apiKeyMascarada: string | null;
  mcpUrl: string | null;
  temMcpToken: boolean;
};

export type ClienteGestao = {
  id: string;
  cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  criadoEm: string;
};

export type ConversaResumo = { id: string; titulo: string; criadoEm: string; atualizadoEm: string };
export type ConversaDetalhe = ConversaResumo & {
  mensagens: { id: string; papel: string; conteudo: string; criadoEm: string }[];
};

export type VinculoCpf = {
  encontrado: boolean;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
  totalDiagnosticos: number;
};

/* ----------------------------- configuração ----------------------------- */

export const obterConfigAgente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConfigAgente> => {
    const { mascarar } = await import("@/lib/gestao-crypto.server");
    const { data, error } = await context.supabase
      .from("consultor_ai_config")
      .select("provedor, modelo, api_key_cifrada, mcp_url, mcp_token_cifrado")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      provedor: (data?.provedor as "openai" | "anthropic") ?? "openai",
      modelo: data?.modelo ?? null,
      temApiKey: Boolean(data?.api_key_cifrada),
      apiKeyMascarada: data?.api_key_cifrada ? mascarar("chave-configurada") : null,
      mcpUrl: data?.mcp_url ?? null,
      temMcpToken: Boolean(data?.mcp_token_cifrado),
    };
  });

export const salvarConfigAgente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        provedor: z.enum(["openai", "anthropic"]),
        modelo: z.string().trim().max(80).optional(),
        apiKey: z.string().trim().max(300).optional(),
        mcpUrl: z.string().trim().max(500).optional(),
        mcpToken: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { cifrar } = await import("@/lib/gestao-crypto.server");
    if (data.mcpUrl && !/^https:\/\//i.test(data.mcpUrl)) {
      throw new Error("A URL do MCP deve começar com https://");
    }

    const patch: Record<string, unknown> = {
      user_id: context.userId,
      provedor: data.provedor,
      modelo: data.modelo || null,
      mcp_url: data.mcpUrl || null,
    };
    if (data.apiKey) patch['api_key_cifrada'] = cifrar(data.apiKey);
    if (data.mcpToken) patch['mcp_token_cifrado'] = cifrar(data.mcpToken);

    const { error } = await context.supabase
      .from("consultor_ai_config")
      .upsert(patch as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------- clientes ------------------------------- */

export const listarClientesGestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClienteGestao[]> => {
    const { data, error } = await context.supabase
      .from("clientes_gestao")
      .select("id, cpf, nome, email, telefone, observacoes, criado_em")
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => ({
      id: c.id,
      cpf: c.cpf,
      nome: c.nome,
      email: c.email,
      telefone: c.telefone,
      observacoes: c.observacoes,
      criadoEm: c.criado_em,
    }));
  });

export const verificarCpfNoCrm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ cpf: z.string().trim().max(20) }).parse(input))
  .handler(async ({ data, context }): Promise<VinculoCpf> => {
    const cpf = apenasDigitosCpf(data.cpf);
    if (!cpfValido(cpf)) throw new Error("CPF inválido.");
    const { data: linhas, error } = await context.supabase
      .from("respostas_diagnostico")
      .select("nome, email, whatsapp, criado_em")
      .eq("cpf", cpf)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    const primeiro = linhas?.[0];
    return {
      encontrado: Boolean(primeiro),
      nome: primeiro?.nome ?? null,
      email: primeiro?.email ?? null,
      whatsapp: primeiro?.whatsapp ?? null,
      totalDiagnosticos: linhas?.length ?? 0,
    };
  });

export const criarClienteGestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cpf: z.string().trim().max(20),
        nome: z.string().trim().min(2).max(120),
        email: z.string().trim().max(255).optional(),
        telefone: z.string().trim().max(30).optional(),
        observacoes: z.string().trim().max(2000).optional(),
      })
      .refine((v) => cpfValido(v.cpf), { message: "CPF inválido." })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: criado, error } = await context.supabase
      .from("clientes_gestao")
      .insert({
        consultor_id: context.userId,
        cpf: apenasDigitosCpf(data.cpf),
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        observacoes: data.observacoes || null,
      })
      .select("id")
      .single();
    if (error) {
      throw new Error(
        error.code === "23505" ? "Este CPF já está cadastrado na sua gestão de clientes." : error.message,
      );
    }
    return { id: criado.id };
  });


export const excluirClienteGestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clientes_gestao").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const obterClienteGestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<ClienteGestao & { vinculo: VinculoCpf }> => {
    const { data: cliente, error } = await context.supabase
      .from("clientes_gestao")
      .select("id, cpf, nome, email, telefone, observacoes, criado_em")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cliente) throw new Error("Cliente não encontrado.");

    const { data: linhas } = await context.supabase
      .from("respostas_diagnostico")
      .select("nome, email, whatsapp")
      .eq("cpf", cliente.cpf);

    return {
      id: cliente.id,
      cpf: cliente.cpf,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      observacoes: cliente.observacoes,
      criadoEm: cliente.criado_em,
      vinculo: {
        encontrado: (linhas?.length ?? 0) > 0,
        nome: linhas?.[0]?.nome ?? null,
        email: linhas?.[0]?.email ?? null,
        whatsapp: linhas?.[0]?.whatsapp ?? null,
        totalDiagnosticos: linhas?.length ?? 0,
      },
    };
  });

/* -------------------------------- agente --------------------------------- */

export const perguntarAgente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        clienteId: z.string().uuid(),
        pergunta: z.string().trim().min(3).max(4000),
        historico: z
          .array(z.object({ papel: z.enum(["user", "assistant"]), conteudo: z.string().max(20000) }))
          .max(20)
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ resposta: string }> => {
    const { decifrar } = await import("@/lib/gestao-crypto.server");
    const { executarAgente } = await import("@/lib/agente.server");

    const { data: config } = await context.supabase
      .from("consultor_ai_config")
      .select("provedor, modelo, api_key_cifrada, mcp_url, mcp_token_cifrado")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!config?.api_key_cifrada) {
      throw new Error("Configure sua chave de API em Gestão de Clientes → Configurações.");
    }

    const { data: cliente } = await context.supabase
      .from("clientes_gestao")
      .select("id, cpf, nome, email, telefone, observacoes")
      .eq("id", data.clienteId)
      .maybeSingle();
    if (!cliente) throw new Error("Cliente não encontrado.");

    const { data: leads } = await context.supabase
      .from("respostas_diagnostico")
      .select(
        "id, diagnostico_titulo, criado_em, score_percentual, perfil_titulo, perfil_descricao, dimensoes_resultado, insights, rotulos, etapa, resultado, motivo_perda, renda, cargo, estado_civil, origem, valor_estimado, proximo_contato",
      )
      .eq("cpf", cliente.cpf)
      .order("criado_em", { ascending: false });

    const ids = (leads ?? []).map((l) => l.id);
    const anotacoes = ids.length
      ? (
          await context.supabase
            .from("lead_anotacoes")
            .select("resposta_id, texto, criado_em")
            .in("resposta_id", ids)
        ).data ?? []
      : [];
    const eventos = ids.length
      ? (
          await context.supabase
            .from("lead_eventos")
            .select("resposta_id, tipo, de, para, criado_em")
            .in("resposta_id", ids)
        ).data ?? []
      : [];

    const contexto = {
      cliente: {
        nome: cliente.nome,
        cpf: cliente.cpf,
        email: cliente.email,
        telefone: cliente.telefone,
        observacoes: cliente.observacoes,
      },
      diagnosticos: leads ?? [],
      anotacoesConsultor: anotacoes,
      historicoCrm: eventos,
    };

    const sistema = [
      "Você é um copiloto de consultoria financeira comportamental que assessora a consultora responsável por este cliente.",
      "Responda sempre em português do Brasil, em formato markdown, objetivo, com recomendações práticas e priorizadas.",
      "Use os diagnósticos, anotações e histórico do CRM abaixo como base factual. Se houver ferramentas do MyMoney disponíveis, use-as para consultar a gestão financeira real do cliente antes de concluir.",
      "Nunca invente números: se um dado não estiver disponível, diga o que falta e como obter.",
      `Contexto do cliente (JSON):\n${JSON.stringify(contexto).slice(0, 120000)}`,
    ].join("\n\n");

    const mcpToken = config.mcp_token_cifrado ? decifrar(config.mcp_token_cifrado) : null;

    const resposta = await executarAgente({
      provedor: (config.provedor as "openai" | "anthropic") ?? "openai",
      apiKey: decifrar(config.api_key_cifrada),
      modelo: config.modelo,
      sistema,
      historico: [...(data.historico ?? []), { papel: "user" as const, conteudo: data.pergunta }],
      mcpUrl: config.mcp_url ?? null,
      mcpToken,
    });

    return { resposta: resposta || "O agente não retornou conteúdo." };
  });

export const transcreverAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ audioBase64: z.string().min(10), mime: z.string().max(60) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ texto: string }> => {
    const chave = process.env["LOVABLE_API_KEY"];
    if (!chave) throw new Error("LOVABLE_API_KEY não configurada.");

    const bytes = Buffer.from(data.audioBase64, "base64");
    if (bytes.byteLength < 2048) throw new Error("Gravação muito curta. Tente novamente.");

    const ext =
      ({ "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav" } as Record<string, string>)[
        data.mime.split(";")[0] ?? ""
      ] ?? "webm";

    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("file", new Blob([new Uint8Array(bytes)], { type: data.mime }), `audio.${ext}`);
    form.append("language", "pt");

    const resposta = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}` },
      body: form,
    });
    const bruto = await resposta.text();
    if (!resposta.ok) throw new Error(`Falha na transcrição (${resposta.status}).`);
    const json = JSON.parse(bruto) as { text?: string };
    return { texto: json.text ?? "" };
  });

/* ------------------------------- histórico -------------------------------- */

export const listarConversas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ clienteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<ConversaResumo[]> => {
    const { data: linhas, error } = await context.supabase
      .from("agente_conversas")
      .select("id, titulo, criado_em, atualizado_em")
      .eq("cliente_id", data.clienteId)
      .order("atualizado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (linhas ?? []).map((c) => ({
      id: c.id,
      titulo: c.titulo,
      criadoEm: c.criado_em,
      atualizadoEm: c.atualizado_em,
    }));
  });

export const obterConversa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<ConversaDetalhe> => {
    const { data: conversa, error } = await context.supabase
      .from("agente_conversas")
      .select("id, titulo, criado_em, atualizado_em")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conversa) throw new Error("Histórico não encontrado.");
    const { data: mensagens } = await context.supabase
      .from("agente_mensagens")
      .select("id, papel, conteudo, criado_em")
      .eq("conversa_id", data.id)
      .order("ordem", { ascending: true });
    return {
      id: conversa.id,
      titulo: conversa.titulo,
      criadoEm: conversa.criado_em,
      atualizadoEm: conversa.atualizado_em,
      mensagens: (mensagens ?? []).map((m) => ({
        id: m.id,
        papel: m.papel,
        conteudo: m.conteudo,
        criadoEm: m.criado_em,
      })),
    };
  });

export const salvarConversa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        clienteId: z.string().uuid(),
        conversaId: z.string().uuid().nullable().optional(),
        titulo: z.string().trim().min(1).max(160),
        mensagens: z
          .array(z.object({ papel: z.enum(["user", "assistant"]), conteudo: z.string().max(40000) }))
          .min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    let conversaId = data.conversaId ?? null;
    let inicioOrdem = 0;

    if (conversaId) {
      const { data: existente, error: erroExistente } = await context.supabase
        .from("agente_conversas")
        .select("id")
        .eq("id", conversaId)
        .maybeSingle();
      if (erroExistente) throw new Error(erroExistente.message);
      if (!existente) throw new Error("Histórico não encontrado.");

      const { data: ultima } = await context.supabase
        .from("agente_mensagens")
        .select("ordem")
        .eq("conversa_id", conversaId)
        .order("ordem", { ascending: false })
        .limit(1)
        .maybeSingle();
      inicioOrdem = (ultima?.ordem ?? -1) + 1;

      const { error: erroUpdate } = await context.supabase
        .from("agente_conversas")
        .update({ atualizado_em: new Date().toISOString() })
        .eq("id", conversaId);
      if (erroUpdate) throw new Error(erroUpdate.message);
    } else {
      const { data: conversa, error } = await context.supabase
        .from("agente_conversas")
        .insert({ cliente_id: data.clienteId, consultor_id: context.userId, titulo: data.titulo })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversaId = conversa.id;
    }

    const { error: erroMsg } = await context.supabase.from("agente_mensagens").insert(
      data.mensagens.map((m, indice) => ({
        conversa_id: conversaId!,
        papel: m.papel,
        conteudo: m.conteudo,
        ordem: inicioOrdem + indice,
      })),
    );
    if (erroMsg) throw new Error(erroMsg.message);
    return { id: conversaId! };
  });

export const excluirConversa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("agente_conversas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
