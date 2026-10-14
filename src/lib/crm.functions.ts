import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apenasDigitosCpf, cpfValido } from "@/lib/cpf";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { DimensaoResultado, Insights } from "./respostas.functions";

/** Etapas legadas (mantidas apenas para leitura de histórico antigo). */
export const ETAPAS = [
  "novo",
  "contatado",
  "devolutiva_agendada",
  "proposta_enviada",
  "cliente",
  "perdido",
] as const;

export type Etapa = (typeof ETAPAS)[number];

export const ETAPA_LABEL: Record<Etapa, string> = {
  novo: "Novo",
  contatado: "Contatado",
  devolutiva_agendada: "Devolutiva agendada",
  proposta_enviada: "Proposta enviada",
  cliente: "Cliente",
  perdido: "Perdido",
};

export type Resultado = "aberto" | "ganho" | "perdido";

export type EtapaFunil = {
  id: string;
  titulo: string;
  cor: string;
  ordem: number;
};

export type MotivoPerda = {
  id: string;
  titulo: string;
  ordem: number;
  ativo: boolean;
};

export type Origem = {
  id: string;
  titulo: string;
  ordem: number;
  ativo: boolean;
};



export type LeadResumo = {
  id: string;
  diagnosticoId: string;
  diagnosticoTitulo: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  scorePercentual: number;
  perfilTitulo: string | null;
  perfilCor: string | null;
  etapa: Etapa;
  etapaId: string | null;
  resultado: Resultado;
  motivoPerdaId: string | null;
  motivoPerdaTitulo: string | null;
  fechadoEm: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  proximoContato: string | null;
  valorEstimado: number | null;
  motivoPerda: string | null;
  origemId: string | null;
  origemTitulo: string | null;
  renda: string | null;
  cargo: string | null;
  cpf: string | null;

  criadoEm: string;
};

export type LeadDetalhe = LeadResumo & {
  score: number;
  scoreMaximo: number;
  perfilDescricao: string | null;
  perfilConteudo: import("./perfil-conteudo").ConteudoPerfil | null;
  dimensoes: DimensaoResultado[];
  distribuicao: import("./perfil-conteudo").FatiaPerfil[];
  insights: Insights | null;

  itens: { dimensaoTitulo: string | null; perguntaTexto: string; opcaoTexto: string; pesoAplicado: number }[];
  anotacoes: {
    id: string;
    texto: string;
    origem: string;
    autorNome: string | null;
    criadoEm: string;
    anexos: { id: string; nome: string; mime: string | null; tamanho: number; path: string }[];
  }[];
  eventos: { id: string; tipo: string; de: string | null; para: string | null; autorNome: string | null; criadoEm: string }[];
};

export type ResponsavelOpcao = { id: string; nome: string };

type LinhaLead = {
  id: string;
  diagnostico_id: string;
  diagnostico_titulo: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  score_percentual: number | string;
  perfil_titulo: string | null;
  perfil_cor: string | null;
  etapa: Etapa;
  etapa_id: string | null;
  resultado: Resultado;
  motivo_perda_id: string | null;
  fechado_em: string | null;
  responsavel_id: string | null;
  proximo_contato: string | null;
  valor_estimado: number | string | null;
  motivo_perda: string | null;
  origem_id: string | null;
  renda: string | null;
  cargo: string | null;
  cpf: string | null;
  criado_em: string;
};

function mapResumo(
  r: LinhaLead,
  nomes: Map<string, string>,
  motivos: Map<string, string>,
  origens: Map<string, string>,
): LeadResumo {
  return {
    id: r.id,
    diagnosticoId: r.diagnostico_id,
    diagnosticoTitulo: r.diagnostico_titulo,
    nome: r.nome,
    email: r.email,
    whatsapp: r.whatsapp,
    scorePercentual: Number(r.score_percentual),
    perfilTitulo: r.perfil_titulo,
    perfilCor: r.perfil_cor,
    etapa: r.etapa,
    etapaId: r.etapa_id,
    resultado: r.resultado ?? "aberto",
    motivoPerdaId: r.motivo_perda_id,
    motivoPerdaTitulo: r.motivo_perda_id ? motivos.get(r.motivo_perda_id) ?? null : null,
    fechadoEm: r.fechado_em,
    responsavelId: r.responsavel_id,
    responsavelNome: r.responsavel_id ? nomes.get(r.responsavel_id) ?? null : null,
    proximoContato: r.proximo_contato,
    valorEstimado: r.valor_estimado === null ? null : Number(r.valor_estimado),
    motivoPerda: r.motivo_perda,
    origemId: r.origem_id ?? null,
    origemTitulo: r.origem_id ? origens.get(r.origem_id) ?? null : null,
    renda: r.renda ?? null,
    cargo: r.cargo ?? null,
    cpf: r.cpf ?? null,
    criadoEm: r.criado_em,
  };
}

const COLUNAS_LEAD =
  "id, diagnostico_id, diagnostico_titulo, nome, email, whatsapp, score_percentual, perfil_titulo, perfil_cor, etapa, etapa_id, resultado, motivo_perda_id, fechado_em, responsavel_id, proximo_contato, valor_estimado, motivo_perda, origem_id, renda, cargo, cpf, criado_em";

/* ------------------------------------------------------------------ */
/* Etapas do funil                                                     */
/* ------------------------------------------------------------------ */

export const listarEtapas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EtapaFunil[]> => {
    const { data, error } = await context.supabase
      .from("crm_etapas")
      .select("id, titulo, cor, ordem")
      .eq("ativo", true)
      .order("ordem");
    if (error) throw new Error(error.message);
    return (data ?? []).map((e) => ({ id: e.id, titulo: e.titulo, cor: e.cor, ordem: e.ordem }));
  });

export const criarEtapa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ titulo: z.string().trim().min(1).max(60), cor: z.string().trim().min(4).max(20) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: ultima } = await context.supabase
      .from("crm_etapas")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await context.supabase.from("crm_etapas").insert({
      titulo: data.titulo,
      cor: data.cor,
      ordem: (ultima?.ordem ?? -1) + 1,
    });
    if (error) throw new Error("Somente a administradora master pode criar etapas.");
    return { ok: true };
  });

export const atualizarEtapa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        titulo: z.string().trim().min(1).max(60).optional(),
        cor: z.string().trim().min(4).max(20).optional(),
        ordem: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: { titulo?: string; cor?: string; ordem?: number } = {};
    if (data.titulo !== undefined) patch.titulo = data.titulo;
    if (data.cor !== undefined) patch.cor = data.cor;
    if (data.ordem !== undefined) patch.ordem = data.ordem;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error, count } = await context.supabase
      .from("crm_etapas")
      .update(patch, { count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Somente a administradora master pode editar etapas.");
    return { ok: true };
  });

export const reordenarEtapas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    for (const [indice, id] of data.ids.entries()) {
      const { error, count } = await context.supabase
        .from("crm_etapas")
        .update({ ordem: indice }, { count: "exact" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      if (!count) throw new Error("Somente a administradora master pode reordenar etapas.");
    }
    return { ok: true };
  });

export const excluirEtapa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), destinoId: z.string().uuid().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.destinoId === data.id) throw new Error("Escolha uma etapa de destino diferente.");

    const { count: cards } = await context.supabase
      .from("respostas_diagnostico")
      .select("id", { count: "exact", head: true })
      .eq("etapa_id", data.id);

    if (cards && cards > 0) {
      if (!data.destinoId) throw new Error("Escolha para qual etapa os leads devem ir.");
      const { error: erroMover } = await context.supabase
        .from("respostas_diagnostico")
        .update({ etapa_id: data.destinoId })
        .eq("etapa_id", data.id);
      if (erroMover) throw new Error(erroMover.message);
    }

    const { error, count } = await context.supabase
      .from("crm_etapas")
      .delete({ count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Somente a administradora master pode excluir etapas.");
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Motivos de perda                                                    */
/* ------------------------------------------------------------------ */

export const listarMotivosPerda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MotivoPerda[]> => {
    const { data, error } = await context.supabase
      .from("motivos_perda")
      .select("id, titulo, ordem, ativo")
      .order("ordem");
    if (error) throw new Error(error.message);
    return (data ?? []).map((m) => ({ id: m.id, titulo: m.titulo, ordem: m.ordem, ativo: m.ativo }));
  });

export const criarMotivoPerda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ titulo: z.string().trim().min(1).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: ultimo } = await context.supabase
      .from("motivos_perda")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await context.supabase
      .from("motivos_perda")
      .insert({ titulo: data.titulo, ordem: (ultimo?.ordem ?? -1) + 1 });
    if (error) throw new Error("Somente a administradora master pode criar motivos de perda.");
    return { ok: true };
  });

export const atualizarMotivoPerda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        titulo: z.string().trim().min(1).max(120).optional(),
        ativo: z.boolean().optional(),
        ordem: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: { titulo?: string; ativo?: boolean; ordem?: number } = {};
    if (data.titulo !== undefined) patch.titulo = data.titulo;
    if (data.ativo !== undefined) patch.ativo = data.ativo;
    if (data.ordem !== undefined) patch.ordem = data.ordem;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error, count } = await context.supabase
      .from("motivos_perda")
      .update(patch, { count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Somente a administradora master pode editar motivos de perda.");
    return { ok: true };
  });

export const excluirMotivoPerda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { count: emUso } = await context.supabase
      .from("respostas_diagnostico")
      .select("id", { count: "exact", head: true })
      .eq("motivo_perda_id", data.id);

    if (emUso && emUso > 0) {
      const { error, count } = await context.supabase
        .from("motivos_perda")
        .update({ ativo: false }, { count: "exact" })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      if (!count) throw new Error("Somente a administradora master pode remover motivos de perda.");
      return { ok: true, desativado: true };
    }

    const { error, count } = await context.supabase
      .from("motivos_perda")
      .delete({ count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Somente a administradora master pode remover motivos de perda.");
    return { ok: true, desativado: false };
  });

/* ------------------------------------------------------------------ */
/* Origens                                                             */
/* ------------------------------------------------------------------ */

export const listarOrigens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Origem[]> => {
    const { data, error } = await context.supabase
      .from("origens")
      .select("id, titulo, ordem, ativo")
      .order("ordem");
    if (error) throw new Error(error.message);
    return (data ?? []).map((o) => ({ id: o.id, titulo: o.titulo, ordem: o.ordem, ativo: o.ativo }));
  });

export const criarOrigem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ titulo: z.string().trim().min(1).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: ultima } = await context.supabase
      .from("origens")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await context.supabase
      .from("origens")
      .insert({ titulo: data.titulo, ordem: (ultima?.ordem ?? -1) + 1 });
    if (error) throw new Error("Somente a administradora master pode criar origens.");
    return { ok: true };
  });

export const atualizarOrigem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        titulo: z.string().trim().min(1).max(120).optional(),
        ativo: z.boolean().optional(),
        ordem: z.number().int().min(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: { titulo?: string; ativo?: boolean; ordem?: number } = {};
    if (data.titulo !== undefined) patch.titulo = data.titulo;
    if (data.ativo !== undefined) patch.ativo = data.ativo;
    if (data.ordem !== undefined) patch.ordem = data.ordem;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error, count } = await context.supabase
      .from("origens")
      .update(patch, { count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Somente a administradora master pode editar origens.");
    return { ok: true };
  });

export const excluirOrigem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { count: emUso } = await context.supabase
      .from("respostas_diagnostico")
      .select("id", { count: "exact", head: true })
      .eq("origem_id", data.id);

    if (emUso && emUso > 0) {
      const { error, count } = await context.supabase
        .from("origens")
        .update({ ativo: false }, { count: "exact" })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      if (!count) throw new Error("Somente a administradora master pode remover origens.");
      return { ok: true, desativado: true };
    }

    const { error, count } = await context.supabase
      .from("origens")
      .delete({ count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Somente a administradora master pode remover origens.");
    return { ok: true, desativado: false };
  });

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

async function carregarMapas(supabase: SupabaseClient<Database>) {
  const [{ data: perfis }, { data: motivos }, { data: origens }] = await Promise.all([
    supabase.from("profiles").select("id, nome_completo, email"),
    supabase.from("motivos_perda").select("id, titulo"),
    supabase.from("origens").select("id, titulo"),
  ]);
  const nomes = new Map<string, string>(
    (perfis ?? []).map((p) => [p.id, (p.nome_completo ?? "").trim() || p.email || "Sem nome"]),
  );
  const mapaMotivos = new Map<string, string>((motivos ?? []).map((m) => [m.id, m.titulo]));
  const mapaOrigens = new Map<string, string>((origens ?? []).map((o) => [o.id, o.titulo]));
  return { nomes, mapaMotivos, mapaOrigens };
}

export const listarLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LeadResumo[]> => {
    const { data, error } = await context.supabase
      .from("respostas_diagnostico")
      .select(COLUNAS_LEAD)
      .order("criado_em", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);

    const { nomes, mapaMotivos, mapaOrigens } = await carregarMapas(context.supabase);

    return ((data ?? []) as unknown as LinhaLead[]).map((r) =>
      mapResumo(r, nomes, mapaMotivos, mapaOrigens),
    );
  });

export const listarResponsaveis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ResponsavelOpcao[]> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, nome_completo, email")
      .eq("status", "aprovado")
      .order("nome_completo");
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => ({ id: p.id, nome: p.nome_completo?.trim() || p.email || "Sem nome" }));
  });

export const obterLead = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<LeadDetalhe> => {
    const { data: r, error } = await context.supabase
      .from("respostas_diagnostico")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Lead não encontrado.");

    const [{ data: itens }, { data: anotacoes }, { data: eventos }, { data: anexos }] = await Promise.all([
      context.supabase
        .from("respostas_itens")
        .select("dimensao_titulo, pergunta_texto, opcao_texto, peso_aplicado")
        .eq("resposta_id", data.id),
      context.supabase
        .from("lead_anotacoes")
        .select("id, texto, origem, autor_id, criado_em")
        .eq("resposta_id", data.id)
        .order("criado_em", { ascending: false }),
      context.supabase
        .from("lead_eventos")
        .select("id, tipo, de, para, autor_id, criado_em")
        .eq("resposta_id", data.id)
        .order("criado_em", { ascending: false }),
      context.supabase
        .from("lead_anexos")
        .select("id, anotacao_id, nome, mime, tamanho, path")
        .eq("resposta_id", data.id)
        .order("criado_em", { ascending: true }),
    ]);

    const { nomes, mapaMotivos, mapaOrigens } = await carregarMapas(context.supabase);

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
      ...mapResumo(r as unknown as LinhaLead, nomes, mapaMotivos, mapaOrigens),
      score: Number(r.score),
      scoreMaximo: Number(r.score_maximo),
      perfilDescricao: r.perfil_descricao,
      perfilConteudo: normalizarConteudoPerfil(perfilAtual?.conteudo),
      dimensoes,
      distribuicao: calcularDistribuicaoPerfis(dimensoes, cores),
      insights: (r.insights as unknown as Insights | null) ?? null,

      itens: (itens ?? []).map((i) => ({
        dimensaoTitulo: i.dimensao_titulo,
        perguntaTexto: i.pergunta_texto,
        opcaoTexto: i.opcao_texto,
        pesoAplicado: Number(i.peso_aplicado),
      })),
      anotacoes: (anotacoes ?? []).map((a) => ({
        id: a.id,
        texto: a.texto,
        origem: a.origem ?? "manual",
        autorNome: a.autor_id ? nomes.get(a.autor_id) ?? null : null,
        criadoEm: a.criado_em,
        anexos: (anexos ?? [])
          .filter((x) => x.anotacao_id === a.id)
          .map((x) => ({
            id: x.id,
            nome: x.nome,
            mime: x.mime,
            tamanho: Number(x.tamanho ?? 0),
            path: x.path,
          })),
      })),
      eventos: (eventos ?? []).map((e) => ({
        id: e.id,
        tipo: e.tipo,
        de: e.de,
        para: e.para,
        autorNome: e.autor_id ? nomes.get(e.autor_id) ?? null : null,
        criadoEm: e.criado_em,
      })),
    };
  });

const atualizarInput = z.object({
  id: z.string().uuid(),
  etapaId: z.string().uuid().nullable().optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  origemId: z.string().uuid().nullable().optional(),
  proximoContato: z.string().nullable().optional(),
  valorEstimado: z.number().nonnegative().nullable().optional(),
});

export const atualizarLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => atualizarInput.parse(input))
  .handler(async ({ data, context }) => {
    const patch: {
      etapa_id?: string | null;
      responsavel_id?: string | null;
      origem_id?: string | null;
      proximo_contato?: string | null;
      valor_estimado?: number | null;
    } = {};
    if (data.etapaId !== undefined) patch.etapa_id = data.etapaId;
    if (data.responsavelId !== undefined) patch.responsavel_id = data.responsavelId;
    if (data.origemId !== undefined) patch.origem_id = data.origemId;
    if (data.proximoContato !== undefined) patch.proximo_contato = data.proximoContato || null;
    if (data.valorEstimado !== undefined) patch.valor_estimado = data.valorEstimado;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error, count } = await context.supabase
      .from("respostas_diagnostico")
      .update(patch, { count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Não foi possível salvar a alteração do lead (sem permissão ou lead inexistente).");
    return { ok: true };
  });

export const marcarResultado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        resultado: z.enum(["aberto", "ganho", "perdido"]),
        motivoPerdaId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.resultado === "perdido" && !data.motivoPerdaId) {
      throw new Error("Escolha o motivo da perda.");
    }

    if (data.resultado === "ganho") {
      const { data: lead } = await context.supabase
        .from("respostas_diagnostico")
        .select("cpf")
        .eq("id", data.id)
        .maybeSingle();
      if (!lead?.cpf || !cpfValido(lead.cpf)) {
        throw new Error("Preencha um CPF válido no lead antes de marcar como Ganho.");
      }
    }

    const patch = {
      resultado: data.resultado,
      motivo_perda_id: data.resultado === "perdido" ? data.motivoPerdaId ?? null : null,
      fechado_em: data.resultado === "aberto" ? null : new Date().toISOString(),
    };

    const { error, count } = await context.supabase
      .from("respostas_diagnostico")
      .update(patch, { count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Não foi possível registrar o desfecho do lead.");
    return { ok: true };
  });

export const atualizarCpfLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), cpf: z.string().trim().max(20) })
      .refine((v) => cpfValido(v.cpf), { message: "CPF inválido." })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error, count } = await context.supabase
      .from("respostas_diagnostico")
      .update({ cpf: apenasDigitosCpf(data.cpf) }, { count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Não foi possível salvar o CPF.");
    return { ok: true };
  });

export type DiagnosticoDoCpf = {
  id: string;
  diagnosticoId: string;
  diagnosticoTitulo: string;
  perfilTitulo: string | null;
  perfilCor: string | null;
  scorePercentual: number;
  criadoEm: string;
};

export const listarDiagnosticosPorCpf = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ cpf: z.string().trim().max(20) }).parse(input))
  .handler(async ({ data, context }): Promise<DiagnosticoDoCpf[]> => {
    const cpf = apenasDigitosCpf(data.cpf);
    if (cpf.length !== 11) return [];
    const { data: linhas, error } = await context.supabase
      .from("respostas_diagnostico")
      .select("id, diagnostico_id, diagnostico_titulo, perfil_titulo, perfil_cor, score_percentual, criado_em")
      .eq("cpf", cpf)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (linhas ?? []).map((l) => ({
      id: l.id,
      diagnosticoId: l.diagnostico_id,
      diagnosticoTitulo: l.diagnostico_titulo,
      perfilTitulo: l.perfil_titulo ?? null,
      perfilCor: l.perfil_cor ?? null,
      scorePercentual: Number(l.score_percentual ?? 0),
      criadoEm: l.criado_em,
    }));
  });

export const criarAnotacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        respostaId: z.string().uuid(),
        texto: z.string().trim().max(4000).default(""),
        origem: z.enum(["manual", "ditado"]).default("manual"),
        anexos: z
          .array(
            z.object({
              path: z.string().min(1).max(500),
              nome: z.string().min(1).max(255),
              mime: z.string().max(120).nullable().default(null),
              tamanho: z.number().int().min(0).max(20 * 1024 * 1024),
            }),
          )
          .max(10)
          .default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!data.texto.trim() && data.anexos.length === 0) {
      throw new Error("Escreva uma anotação ou anexe um arquivo.");
    }

    const { data: nota, error } = await context.supabase
      .from("lead_anotacoes")
      .insert({
        resposta_id: data.respostaId,
        autor_id: context.userId,
        texto: data.texto.trim() || "(anexo)",
        origem: data.origem,
      })
      .select("id")
      .single();
    if (error || !nota) throw new Error(error?.message ?? "Não foi possível salvar a anotação.");

    if (data.anexos.length > 0) {
      const { error: erroAnexos } = await context.supabase.from("lead_anexos").insert(
        data.anexos.map((a) => ({
          anotacao_id: nota.id,
          resposta_id: data.respostaId,
          autor_id: context.userId,
          path: a.path,
          nome: a.nome,
          mime: a.mime,
          tamanho: a.tamanho,
        })),
      );
      if (erroAnexos) throw new Error(erroAnexos.message);
    }

    return { ok: true, id: nota.id };
  });

export const gerarUrlAnexo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { data: anexo, error } = await context.supabase
      .from("lead_anexos")
      .select("path")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!anexo) throw new Error("Anexo não encontrado.");

    const { data: assinada, error: erroUrl } = await context.supabase.storage
      .from("lead-anexos")
      .createSignedUrl(anexo.path, 60 * 10);
    if (erroUrl || !assinada) throw new Error(erroUrl?.message ?? "Não foi possível abrir o anexo.");
    return { url: assinada.signedUrl };
  });

export const excluirAnotacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: anexos } = await context.supabase
      .from("lead_anexos")
      .select("path")
      .eq("anotacao_id", data.id);

    const { error } = await context.supabase.from("lead_anotacoes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    if (anexos && anexos.length > 0) {
      await context.supabase.storage.from("lead-anexos").remove(anexos.map((a) => a.path));
    }
    return { ok: true };
  });

export const excluirLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error, count } = await context.supabase
      .from("respostas_diagnostico")
      .delete({ count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Somente a administradora master pode excluir leads.");
    return { ok: true };
  });
