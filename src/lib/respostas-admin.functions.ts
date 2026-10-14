import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DimensaoResultado, Insights } from "./respostas.functions";

export type RespostaResumo = {
  id: string;
  diagnosticoId: string;
  diagnosticoTitulo: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  scorePercentual: number;
  perfilTitulo: string | null;
  perfilCor: string | null;
  ramo: string | null;
  criadoEm: string;
};

export type RespostaDetalhe = RespostaResumo & {
  score: number;
  scoreMaximo: number;
  perfilDescricao: string | null;
  perfilConteudo: import("./perfil-conteudo").ConteudoPerfil | null;
  dimensoes: DimensaoResultado[];
  distribuicao: import("./perfil-conteudo").FatiaPerfil[];
  insights: Insights | null;
  devolutiva: import("./devolutiva.server").Devolutiva | null;
  itens: { dimensaoTitulo: string | null; perguntaTexto: string; opcaoTexto: string; pesoAplicado: number }[];
};


export const listarRespostas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RespostaResumo[]> => {
    const { data, error } = await context.supabase
      .from("respostas_diagnostico")
      .select("id, diagnostico_id, diagnostico_titulo, nome, email, whatsapp, score_percentual, perfil_titulo, perfil_cor, ramo, criado_em")
      .order("criado_em", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);

    return (data ?? []).map((r) => ({
      id: r.id,
      diagnosticoId: r.diagnostico_id,
      diagnosticoTitulo: r.diagnostico_titulo,
      nome: r.nome,
      email: r.email,
      whatsapp: r.whatsapp,
      scorePercentual: Number(r.score_percentual),
      perfilTitulo: r.perfil_titulo,
      perfilCor: r.perfil_cor,
      ramo: r.ramo ?? null,
      criadoEm: r.criado_em,
    }));
  });

export const obterRespostaDetalhe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<RespostaDetalhe> => {
    const { data: r, error } = await context.supabase
      .from("respostas_diagnostico")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Resposta não encontrada.");

    const { data: itens, error: erroItens } = await context.supabase
      .from("respostas_itens")
      .select("dimensao_titulo, pergunta_texto, opcao_texto, peso_aplicado")
      .eq("resposta_id", data.id);
    if (erroItens) throw new Error(erroItens.message);

    const { calcularDistribuicaoPerfis, normalizarConteudoPerfil } = await import("./perfil-conteudo");
    const { data: perfis } = await context.supabase
      .from("perfis_resultado")
      .select("id, cor, dimensao_id, conteudo")
      .eq("diagnostico_id", r.diagnostico_id);
    const cores: Record<string, string | null> = {};
    for (const p of perfis ?? []) {
      if (p.dimensao_id) cores[p.dimensao_id] = p.cor;
    }
    const perfilAtual = (perfis ?? []).find((p) => p.id === r.perfil_id) ?? null;
    const dimensoes = Array.isArray(r.dimensoes_resultado)
      ? (r.dimensoes_resultado as unknown as DimensaoResultado[])
      : [];

    return {
      id: r.id,
      diagnosticoId: r.diagnostico_id,
      diagnosticoTitulo: r.diagnostico_titulo,
      nome: r.nome,
      email: r.email,
      whatsapp: r.whatsapp,
      score: Number(r.score),
      scoreMaximo: Number(r.score_maximo),
      scorePercentual: Number(r.score_percentual),
      perfilTitulo: r.perfil_titulo,
      perfilDescricao: r.perfil_descricao,
      perfilConteudo: normalizarConteudoPerfil(perfilAtual?.conteudo),
      perfilCor: r.perfil_cor,
      ramo: r.ramo ?? null,
      dimensoes,
      distribuicao: calcularDistribuicaoPerfis(dimensoes, cores),
      insights: (r.insights as unknown as Insights | null) ?? null,

      devolutiva: (r.devolutiva as unknown as RespostaDetalhe["devolutiva"]) ?? null,
      criadoEm: r.criado_em,
      itens: (itens ?? []).map((i) => ({
        dimensaoTitulo: i.dimensao_titulo,
        perguntaTexto: i.pergunta_texto,
        opcaoTexto: i.opcao_texto,
        pesoAplicado: Number(i.peso_aplicado),
      })),
    };
  });

export const excluirResposta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("respostas_diagnostico").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reenviarDevolutivaEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; motivo?: string }> => {
    const { enfileirarDevolutiva } = await import("@/lib/email/devolutiva-email.server");
    return enfileirarDevolutiva(data.id);
  });
