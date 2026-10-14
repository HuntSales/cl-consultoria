import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  escolherPerfil,
  normalizarModoAtivacao,
  normalizarRegras,
  
  ordenarDimensoes,
  type ModoAtivacao,
} from "@/lib/scoring";

type AppSupabaseClient = SupabaseClient<Database>;




type DiagnosticoStatus = Database["public"]["Enums"]["diagnostico_status"];

export type DiagnosticoResumo = {
  id: string;
  titulo: string;
  descricao: string | null;
  slug: string;
  status: DiagnosticoStatus;
  totalDimensoes: number;
  totalPerguntas: number;
  criadoEm: string;
  atualizadoEm: string;
};

export type DiagnosticoCompleto = {
  id: string;
  titulo: string;
  descricao: string | null;
  capaItens: string | null;
  linkAgendamento: string | null;
  slug: string;
  status: DiagnosticoStatus;
  dimensoes: DimensaoCompleta[];
  perfis: PerfilResultado[];
};

export type Ramo = "comum" | "solteiro" | "casal";

export type DimensaoCompleta = {
  id: string;
  diagnosticoId: string;
  titulo: string;
  descricao: string | null;
  pesoDimensao: number;
  ordem: number;
  ramo: Ramo;
  perguntas: PerguntaCompleta[];
};

export type PerguntaCompleta = {
  id: string;
  dimensaoId: string;
  texto: string;
  ordem: number;
  obrigatoria: boolean;
  ramifica: boolean;
  pesoPergunta: number;
  opcoes: OpcaoResposta[];
};

export type OpcaoResposta = {
  id: string;
  perguntaId: string;
  texto: string;
  peso: number;
  ordem: number;
  letra: string | null;
  ramo: Ramo | null;
  rotulo: string | null;
  rotuloDescricao: string | null;
};


export type RegraPerfil = { pergunta: number; opcoes: string[] };


export type PerfilResultado = {
  id: string;
  diagnosticoId: string;
  titulo: string;
  descricao: string | null;
  faixaMin: number;
  faixaMax: number;
  cor: string;
  ordem: number;
  regras: RegraPerfil[];
  minRegras: number;
  modoAtivacao: ModoAtivacao;
  ctaTexto: string | null;
  ctaUrl: string | null;
  ramo: Ramo;
  dimensaoId: string | null;
};


export type ResultadoPreview = {
  score: number;
  scoreMaximo: number;
  scorePercentual: number;
  perfil: PerfilResultado | null;
  criterio: "regras" | "faixa" | "dimensao" | null;
  ramo: Ramo | null;
  dimensoes: { id: string; titulo: string; score: number; scoreMaximo: number; scorePercentual: number }[];
};




function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function garantirSlugUnico(
  supabase: AppSupabaseClient,
  slug: string,
  excluirId?: string,
) {

  let slugFinal = slug;
  let tentativas = 0;
  while (tentativas < 10) {
    const query = supabase.from("diagnosticos").select("id").eq("slug", slugFinal);
    const { data } = excluirId ? await query.neq("id", excluirId) : await query;
    if (!data || data.length === 0) return slugFinal;
    tentativas++;
    slugFinal = `${slug}-${tentativas}`;
  }
  throw new Error("Não foi possível gerar um slug único.");
}

export const listarDiagnosticos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiagnosticoResumo[]> => {
    const { data, error } = await context.supabase
      .from("diagnosticos")
      .select("*, dimensoes(id, perguntas(id))")
      .order("atualizado_em", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((d) => {
      const totalDimensoes = Array.isArray(d.dimensoes) ? d.dimensoes.length : 0;
      const totalPerguntas = Array.isArray(d.dimensoes)
        ? d.dimensoes.reduce((acc, dim) => acc + (Array.isArray(dim.perguntas) ? dim.perguntas.length : 0), 0)
        : 0;
      return {
        id: d.id,
        titulo: d.titulo,
        descricao: d.descricao,
        slug: d.slug,
        status: d.status,
        totalDimensoes,
        totalPerguntas,
        criadoEm: d.criado_em,
        atualizadoEm: d.atualizado_em,
      };
    });
  });

export const obterDiagnostico = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<DiagnosticoCompleto> => {
    const { data: diagnostico, error } = await context.supabase
      .from("diagnosticos")
      .select("*, dimensoes(*, perguntas(*, opcoes_resposta(*))), perfis_resultado(*)")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!diagnostico) throw new Error("Diagnóstico não encontrado.");

    const dimensoes = (diagnostico.dimensoes ?? []).map((dim) => ({
      id: dim.id,
      diagnosticoId: dim.diagnostico_id,
      titulo: dim.titulo,
      descricao: dim.descricao,
      pesoDimensao: dim.peso_dimensao,
      ordem: dim.ordem,
      ramo: (dim.ramo ?? "comum") as Ramo,
      perguntas: (dim.perguntas ?? []).map((perg) => ({
        id: perg.id,
        dimensaoId: perg.dimensao_id,
        texto: perg.texto,
        ordem: perg.ordem,
        obrigatoria: perg.obrigatoria,
        ramifica: perg.ramifica ?? false,
        pesoPergunta: Number(perg.peso_pergunta ?? 1) || 1,

        opcoes: (perg.opcoes_resposta ?? []).map((opc) => ({
          id: opc.id,
          perguntaId: opc.pergunta_id,
          texto: opc.texto,
          peso: opc.peso,
          ordem: opc.ordem,
          letra: opc.letra ?? null,
          ramo: (opc.ramo ?? null) as Ramo | null,
          rotulo: opc.rotulo ?? null,
          rotuloDescricao: opc.rotulo_descricao ?? null,
        })),
      })),
    }));

    dimensoes.sort((a, b) => a.ordem - b.ordem);
    dimensoes.forEach((dim) => {
      dim.perguntas.sort((a, b) => a.ordem - b.ordem);
      dim.perguntas.forEach((perg) => perg.opcoes.sort((a, b) => a.ordem - b.ordem));
    });

    const perfis = (diagnostico.perfis_resultado ?? []).map((p) => ({
      id: p.id,
      diagnosticoId: p.diagnostico_id,
      titulo: p.titulo,
      descricao: p.descricao,
      faixaMin: p.faixa_min,
      faixaMax: p.faixa_max,
      cor: p.cor,
      ordem: p.ordem,
      regras: normalizarRegras(p.regras),
      minRegras: p.min_regras ?? 1,
      modoAtivacao: normalizarModoAtivacao(p.modo_ativacao),
      ctaTexto: p.cta_texto ?? null,
      ctaUrl: p.cta_url ?? null,

      ramo: (p.ramo ?? "comum") as Ramo,
      dimensaoId: (p as { dimensao_id?: string | null }).dimensao_id ?? null,
    }));
    perfis.sort((a, b) => a.ordem - b.ordem);


    return {
      id: diagnostico.id,
      titulo: diagnostico.titulo,
      descricao: diagnostico.descricao,
      capaItens: diagnostico.capa_itens ?? null,
      linkAgendamento: diagnostico.link_agendamento ?? null,
      slug: diagnostico.slug,
      status: diagnostico.status,
      dimensoes,
      perfis,
    };
  });

const criarDiagnosticoInput = z.object({
  titulo: z.string().min(3, "Título precisa ter pelo menos 3 caracteres.").max(120),
  descricao: z.string().max(500).optional(),
  slug: z.string().max(160).optional(),
});

export const criarDiagnostico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => criarDiagnosticoInput.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string; slug: string }> => {
    const baseSlug = slugify(data.slug || data.titulo);
    if (!baseSlug) throw new Error("Não foi possível gerar slug a partir do título.");
    const slug = await garantirSlugUnico(context.supabase, baseSlug);

    const { data: diagnostico, error } = await context.supabase
      .from("diagnosticos")
      .insert({
        titulo: data.titulo,
        descricao: data.descricao || null,
        slug,
        status: "rascunho",
        criado_por: context.userId,
      })
      .select("id, slug")
      .single();

    if (error) throw new Error(error.message);

    const { error: erroPerfil } = await context.supabase.from("perfis_resultado").insert({
      diagnostico_id: diagnostico.id,
      titulo: "Perfil inicial",
      descricao: "Edite este perfil e adicione novas faixas de resultado.",
      faixa_min: 0,
      faixa_max: 100,
      cor: "#d0b266",
      ordem: 0,
    });
    if (erroPerfil) throw new Error(erroPerfil.message);

    return { id: diagnostico.id, slug: diagnostico.slug };
  });

const atualizarDiagnosticoInput = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(3).max(120).optional(),
  descricao: z.string().max(500).optional(),
  capaItens: z.string().max(1000).optional(),
  linkAgendamento: z.string().max(500).optional(),
  slug: z.string().max(160).optional(),
  status: z.enum(["rascunho", "publicado"]).optional(),
});

export const atualizarDiagnostico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => atualizarDiagnosticoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: atual, error: erroAtual } = await context.supabase
      .from("diagnosticos")
      .select("id, status, slug, dimensoes(id, perguntas(id, opcoes_resposta(id)))")
      .eq("id", data.id)
      .maybeSingle();
    if (erroAtual) throw new Error(erroAtual.message);
    if (!atual) throw new Error("Diagnóstico não encontrado.");

    const update: Database["public"]["Tables"]["diagnosticos"]["Update"] = {};
    if (data.titulo !== undefined) update.titulo = data.titulo;
    if (data.descricao !== undefined) update.descricao = data.descricao || null;
    if (data.capaItens !== undefined) update.capa_itens = data.capaItens.trim() || null;
    if (data.linkAgendamento !== undefined)
      update.link_agendamento = data.linkAgendamento.trim() || null;
    if (data.status !== undefined) update.status = data.status;
    if (data.slug !== undefined) {
      const baseSlug = slugify(data.slug);
      if (!baseSlug) throw new Error("Slug inválido.");
      update.slug = await garantirSlugUnico(context.supabase, baseSlug, data.id);
    }

    if (update.status === "publicado") {
      const dimensoes = atual.dimensoes ?? [];
      const perguntas = dimensoes.flatMap((dim) => dim.perguntas ?? []);
      if (perguntas.length === 0) throw new Error("Não é possível publicar um diagnóstico sem perguntas.");
      const perguntasSemOpcoes = perguntas.filter((perg) => !perg.opcoes_resposta || perg.opcoes_resposta.length === 0);
      if (perguntasSemOpcoes.length > 0) {
        throw new Error("Todas as perguntas devem ter pelo menos uma opção de resposta antes de publicar.");
      }
      const { data: perfis } = await context.supabase
        .from("perfis_resultado")
        .select("id")
        .eq("diagnostico_id", data.id);
      if (!perfis || perfis.length === 0) {
        throw new Error("Adicione pelo menos um perfil de resultado antes de publicar.");
      }
    }

    if (Object.keys(update).length === 0) return { ok: true };

    const { error } = await context.supabase.from("diagnosticos").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

export const excluirDiagnostico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("diagnosticos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const salvarDimensaoInput = z.object({
  id: z.string().uuid().optional(),
  diagnosticoId: z.string().uuid(),
  titulo: z.string().min(2).max(120),
  descricao: z.string().max(500).optional(),
  pesoDimensao: z.number().min(0.1).max(10).default(1),
  ramo: z.enum(["comum", "solteiro", "casal"]).optional(),
  ordem: z.number().int().min(0).default(0),
});

export const salvarDimensao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarDimensaoInput.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const payload = {
      diagnostico_id: data.diagnosticoId,
      titulo: data.titulo,
      descricao: data.descricao || null,
      peso_dimensao: data.pesoDimensao,
      ramo: data.ramo ?? "comum",
      ordem: data.ordem,
    };

    if (data.id) {
      const { error } = await context.supabase.from("dimensoes").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: criada, error } = await context.supabase.from("dimensoes").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: criada.id };
  });

export const excluirDimensao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dimensoes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reordenarDimensoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ diagnosticoId: z.string().uuid(), ordem: z.array(z.string().uuid()) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    for (let i = 0; i < data.ordem.length; i++) {
      const { error } = await context.supabase.from("dimensoes").update({ ordem: i }).eq("id", data.ordem[i]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const salvarPerguntaInput = z.object({
  id: z.string().uuid().optional(),
  dimensaoId: z.string().uuid(),
  texto: z.string().min(5).max(600),
  ordem: z.number().int().min(0).default(0),
  obrigatoria: z.boolean().default(true),
  ramifica: z.boolean().optional(),
  pesoPergunta: z.number().min(0).max(10).optional(),

  opcoes: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        texto: z.string().min(1).max(300),
        peso: z.number().min(0).max(1000).default(0),
        ordem: z.number().int().min(0).default(0),
        letra: z.string().max(4).optional(),
        ramo: z.enum(["comum", "solteiro", "casal"]).nullish(),
        rotulo: z.string().max(160).optional(),
        rotuloDescricao: z.string().max(600).optional(),
      }),
    )
    .min(1, "A pergunta precisa ter pelo menos uma opção de resposta."),
});

export const salvarPergunta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarPerguntaInput.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const perguntaPayload = {
      dimensao_id: data.dimensaoId,
      texto: data.texto,
      ordem: data.ordem,
      obrigatoria: data.obrigatoria,
      ramifica: data.ramifica ?? false,
      peso_pergunta: data.pesoPergunta ?? 1,
    };


    let perguntaId = data.id;
    if (perguntaId) {
      const { error } = await context.supabase.from("perguntas").update(perguntaPayload).eq("id", perguntaId);
      if (error) throw new Error(error.message);
    } else {
      const { data: criada, error } = await context.supabase
        .from("perguntas")
        .insert(perguntaPayload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      perguntaId = criada.id;
    }

    const opcoesAtuais = data.id
      ? ((await context.supabase.from("opcoes_resposta").select("id").eq("pergunta_id", perguntaId)).data ?? [])
      : [];
    const idsManter = data.opcoes.filter((o) => o.id).map((o) => o.id!);
    const idsExcluir = opcoesAtuais.map((o) => o.id).filter((id) => !idsManter.includes(id));

    if (idsExcluir.length > 0) {
      const { error } = await context.supabase.from("opcoes_resposta").delete().in("id", idsExcluir);
      if (error) throw new Error(error.message);
    }

    for (const opc of data.opcoes) {
      const opcPayload = {
        pergunta_id: perguntaId,
        texto: opc.texto,
        peso: opc.peso,
        ordem: opc.ordem,
        letra: opc.letra?.trim().toUpperCase() || null,
        ramo: opc.ramo ?? null,
        rotulo: opc.rotulo?.trim() || null,
        rotulo_descricao: opc.rotuloDescricao?.trim() || null,
      };
      if (opc.id) {
        const { error } = await context.supabase.from("opcoes_resposta").update(opcPayload).eq("id", opc.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await context.supabase.from("opcoes_resposta").insert(opcPayload);
        if (error) throw new Error(error.message);
      }
    }

    return { id: perguntaId };
  });

export const excluirPergunta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("perguntas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reordenarPerguntas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ dimensaoId: z.string().uuid(), ordem: z.array(z.string().uuid()) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    for (let i = 0; i < data.ordem.length; i++) {
      const { error } = await context.supabase.from("perguntas").update({ ordem: i }).eq("id", data.ordem[i]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const salvarPerfilInput = z.object({
  id: z.string().uuid().optional(),
  diagnosticoId: z.string().uuid(),
  titulo: z.string().min(2).max(120),
  descricao: z.string().max(6000).optional(),
  faixaMin: z.number().min(0).max(100),
  faixaMax: z.number().min(0).max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato #RRGGBB."),
  ordem: z.number().int().min(0).default(0),
  regras: z.array(z.object({ pergunta: z.number().int().min(1), opcoes: z.array(z.string().max(4)) })).optional(),
  minRegras: z.number().int().min(1).max(50).optional(),
  modoAtivacao: z.enum(["faixa", "regras", "hibrido", "dimensao"]).optional(),
  dimensaoId: z.string().uuid().nullable().optional(),

  ramo: z.enum(["comum", "solteiro", "casal"]).optional(),
  ctaTexto: z.string().max(160).optional(),
  ctaUrl: z.string().max(500).optional(),
});

export const salvarPerfilResultado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarPerfilInput.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    if (data.faixaMin >= data.faixaMax) {
      throw new Error("A faixa mínima deve ser menor que a faixa máxima.");
    }
    const payload = {
      diagnostico_id: data.diagnosticoId,
      titulo: data.titulo,
      descricao: data.descricao || null,
      faixa_min: data.faixaMin,
      faixa_max: data.faixaMax,
      cor: data.cor,
      ordem: data.ordem,
      regras: normalizarRegras(data.regras ?? []),
      min_regras: data.minRegras ?? 1,
      modo_ativacao: data.modoAtivacao ?? "hibrido",
      dimensao_id: data.modoAtivacao === "dimensao" ? (data.dimensaoId ?? null) : null,

      ramo: data.ramo ?? "comum",
      cta_texto: data.ctaTexto?.trim() || null,
      cta_url: data.ctaUrl?.trim() || null,
    };

    if (data.id) {
      const { error } = await context.supabase.from("perfis_resultado").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: criado, error } = await context.supabase
      .from("perfis_resultado")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: criado.id };
  });

export const excluirPerfilResultado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("perfis_resultado").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reordenarPerfis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ diagnosticoId: z.string().uuid(), ordem: z.array(z.string().uuid()) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    for (let i = 0; i < data.ordem.length; i++) {
      const { error } = await context.supabase.from("perfis_resultado").update({ ordem: i }).eq("id", data.ordem[i]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ─── PONTUAÇÃO EM LOTE ─── */
const salvarPontuacaoInput = z.object({
  diagnosticoId: z.string().uuid(),
  dimensoes: z.array(z.object({ id: z.string().uuid(), pesoDimensao: z.number().min(0).max(10) })).default([]),
  perguntas: z.array(z.object({ id: z.string().uuid(), pesoPergunta: z.number().min(0).max(10) })).default([]),
  opcoes: z.array(z.object({ id: z.string().uuid(), peso: z.number().min(0).max(1000) })).default([]),
});

export const salvarPontuacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => salvarPontuacaoInput.parse(input))
  .handler(async ({ data, context }) => {
    for (const dim of data.dimensoes) {
      const { error } = await context.supabase
        .from("dimensoes")
        .update({ peso_dimensao: dim.pesoDimensao })
        .eq("id", dim.id)
        .eq("diagnostico_id", data.diagnosticoId);
      if (error) throw new Error(error.message);
    }
    for (const perg of data.perguntas) {
      const { error } = await context.supabase
        .from("perguntas")
        .update({ peso_pergunta: perg.pesoPergunta })
        .eq("id", perg.id);
      if (error) throw new Error(error.message);
    }
    for (const opc of data.opcoes) {
      const { error } = await context.supabase.from("opcoes_resposta").update({ peso: opc.peso }).eq("id", opc.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const calcularScorePreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        diagnosticoId: z.string().uuid(),
        respostas: z.record(z.string().uuid(), z.string().uuid()),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ResultadoPreview> => {
    const diagnostico = await obterDiagnostico({ data: { id: data.diagnosticoId } });

    // ramo escolhido pela pergunta de ramificação
    let ramoEscolhido: Ramo | null = null;
    for (const dim of diagnostico.dimensoes) {
      for (const perg of dim.perguntas) {
        if (!perg.ramifica) continue;
        const opcao = perg.opcoes.find((o) => o.id === data.respostas[perg.id]);
        if (opcao?.ramo && opcao.ramo !== "comum") ramoEscolhido = opcao.ramo;
      }
    }

    let scoreTotal = 0;
    let scoreMaximo = 0;
    const dimensoesResultado: ResultadoPreview["dimensoes"] = [];
    const letrasPorNumero = new Map<number, string>();
    let numero = 0;

    for (const dimensao of ordenarDimensoes(diagnostico.dimensoes, ramoEscolhido)) {
      const pesoDim = Number(dimensao.pesoDimensao) || 1;
      let scoreDim = 0;
      let maxDim = 0;

      for (const pergunta of dimensao.perguntas.slice().sort((a, b) => a.ordem - b.ordem)) {
        if (pergunta.ramifica) continue;
        const pesoPerg = Number(pergunta.pesoPergunta) || 1;
        numero += 1;
        maxDim += Math.max(...pergunta.opcoes.map((o) => Number(o.peso) || 0), 0) * pesoPerg;
        const opcao = pergunta.opcoes.find((o) => o.id === data.respostas[pergunta.id]);
        if (opcao) {
          scoreDim += (Number(opcao.peso) || 0) * pesoPerg;
          if (opcao.letra) letrasPorNumero.set(numero, opcao.letra.trim().toUpperCase());
        }
      }

      if (maxDim === 0) continue;
      scoreTotal += scoreDim * pesoDim;
      scoreMaximo += maxDim * pesoDim;
      dimensoesResultado.push({
        id: dimensao.id,
        titulo: dimensao.titulo,
        score: scoreDim,
        scoreMaximo: maxDim,
        scorePercentual: Math.round((scoreDim / maxDim) * 100),
      });
    }

    const scorePercentual = scoreMaximo > 0 ? Math.round((scoreTotal / scoreMaximo) * 100) : 0;

    const perfisElegiveis = diagnostico.perfis.filter((p) => {
      const r = p.ramo ?? "comum";
      return r === "comum" || r === (ramoEscolhido ?? "solteiro");
    });
    const { perfil, criterio } = escolherPerfil(
      perfisElegiveis,
      scorePercentual,
      letrasPorNumero,
      dimensoesResultado,
    );

    return {
      score: scoreTotal,
      scoreMaximo,
      scorePercentual,
      perfil,
      criterio,
      ramo: ramoEscolhido,
      dimensoes: dimensoesResultado,
    };
  });


