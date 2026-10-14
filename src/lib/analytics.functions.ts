import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DimensaoResultado } from "./respostas.functions";

export type AnalyticsResumo = {
  totalRespostas: number;
  totalClientes: number;
  taxaConversao: number;
  scoreMedio: number;
  valorPipeline: number;
  respostas30d: number;
  porEtapa: { etapa: string; label: string; total: number }[];
  porPerfil: { perfil: string; cor: string | null; total: number }[];
  porDimensao: { dimensao: string; media: number }[];
  porDiagnostico: { titulo: string; total: number; scoreMedio: number }[];
  evolucao: { dia: string; total: number }[];
};

type Linha = {
  diagnostico_titulo: string;
  score_percentual: number | string;
  perfil_titulo: string | null;
  perfil_cor: string | null;
  etapa_id: string | null;
  resultado: "aberto" | "ganho" | "perdido" | null;
  valor_estimado: number | string | null;
  dimensoes_resultado: unknown;
  criado_em: string;
};

function media(valores: number[]) {
  if (valores.length === 0) return 0;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

export const obterAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsResumo> => {
    const { data, error } = await context.supabase
      .from("respostas_diagnostico")
      .select(
        "diagnostico_titulo, score_percentual, perfil_titulo, perfil_cor, etapa_id, resultado, valor_estimado, dimensoes_resultado, criado_em",
      )
      .order("criado_em", { ascending: true })
      .limit(5000);
    if (error) throw new Error(error.message);

    const { data: etapasData } = await context.supabase
      .from("crm_etapas")
      .select("id, titulo, ordem")
      .order("ordem", { ascending: true });
    const etapas = (etapasData ?? []) as { id: string; titulo: string; ordem: number }[];
    const primeiraEtapaId = etapas[0]?.id ?? null;

    const linhas = (data ?? []) as unknown as Linha[];
    const total = linhas.length;

    const porEtapa = etapas.map((etapa) => ({
      etapa: etapa.id,
      label: etapa.titulo,
      total: linhas.filter((l) => (l.etapa_id ?? primeiraEtapaId) === etapa.id).length,
    }));

    const perfilMap = new Map<string, { cor: string | null; total: number }>();
    for (const l of linhas) {
      const chave = l.perfil_titulo ?? "Sem perfil";
      const atual = perfilMap.get(chave) ?? { cor: l.perfil_cor, total: 0 };
      atual.total += 1;
      perfilMap.set(chave, atual);
    }

    const dimMap = new Map<string, number[]>();
    for (const l of linhas) {
      const dims = Array.isArray(l.dimensoes_resultado)
        ? (l.dimensoes_resultado as unknown as DimensaoResultado[])
        : [];
      for (const d of dims) {
        const titulo = d.titulo ?? "Sem dimensão";
        const lista = dimMap.get(titulo) ?? [];
        lista.push(Number(d.scorePercentual ?? 0));
        dimMap.set(titulo, lista);
      }
    }

    const diagMap = new Map<string, number[]>();
    for (const l of linhas) {
      const lista = diagMap.get(l.diagnostico_titulo) ?? [];
      lista.push(Number(l.score_percentual));
      diagMap.set(l.diagnostico_titulo, lista);
    }

    const hoje = new Date();
    const dias: { dia: string; total: number }[] = [];
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      dias.push({
        dia: iso,
        total: linhas.filter((l) => l.criado_em.slice(0, 10) === iso).length,
      });
    }

    const clientes = linhas.filter((l) => l.resultado === "ganho").length;

    return {
      totalRespostas: total,
      totalClientes: clientes,
      taxaConversao: total === 0 ? 0 : Math.round((clientes / total) * 1000) / 10,
      scoreMedio: media(linhas.map((l) => Number(l.score_percentual))),
      valorPipeline: linhas
        .filter((l) => (l.resultado ?? "aberto") !== "perdido")
        .reduce((soma, l) => soma + Number(l.valor_estimado ?? 0), 0),
      respostas30d: dias.reduce((s, d) => s + d.total, 0),
      porEtapa,
      porPerfil: [...perfilMap.entries()]
        .map(([perfil, v]) => ({ perfil, cor: v.cor, total: v.total }))
        .sort((a, b) => b.total - a.total),
      porDimensao: [...dimMap.entries()]
        .map(([dimensao, valores]) => ({ dimensao, media: media(valores) }))
        .sort((a, b) => a.media - b.media),
      porDiagnostico: [...diagMap.entries()]
        .map(([titulo, valores]) => ({ titulo, total: valores.length, scoreMedio: media(valores) }))
        .sort((a, b) => b.total - a.total),
      evolucao: dias,
    };
  });

export type FunilDiagnostico = {
  diagnosticoId: string;
  titulo: string;
  aberturas: number;
  iniciados: number;
  dados: number;
  concluidos: number;
  taxaConclusao: number;
  taxaAbandono: number;
};

export type FunilResumo = {
  porDiagnostico: FunilDiagnostico[];
  total: FunilDiagnostico;
};

export const obterFunilDiagnosticos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const dias = (input as { dias?: number } | undefined)?.dias;
    return { dias: typeof dias === "number" && dias > 0 ? dias : 0 };
  })
  .handler(async ({ data, context }): Promise<FunilResumo> => {
    let consulta = context.supabase
      .from("diagnostico_sessoes")
      .select("diagnostico_id, aberto_em, iniciado_em, dados_em, concluido_em, diagnosticos(titulo)")
      .order("aberto_em", { ascending: false })
      .limit(20000);

    if (data.dias > 0) {
      const desde = new Date(Date.now() - data.dias * 24 * 60 * 60 * 1000).toISOString();
      consulta = consulta.gte("aberto_em", desde);
    }

    const { data: linhas, error } = await consulta;
    if (error) throw new Error(error.message);

    const mapa = new Map<string, FunilDiagnostico>();
    for (const linha of (linhas ?? []) as unknown as {
      diagnostico_id: string;
      iniciado_em: string | null;
      dados_em: string | null;
      concluido_em: string | null;
      diagnosticos: { titulo: string } | null;
    }[]) {
      const atual =
        mapa.get(linha.diagnostico_id) ??
        {
          diagnosticoId: linha.diagnostico_id,
          titulo: linha.diagnosticos?.titulo ?? "Diagnóstico",
          aberturas: 0,
          iniciados: 0,
          dados: 0,
          concluidos: 0,
          taxaConclusao: 0,
          taxaAbandono: 0,
        };
      atual.aberturas += 1;
      if (linha.iniciado_em) atual.iniciados += 1;
      if (linha.dados_em) atual.dados += 1;
      if (linha.concluido_em) atual.concluidos += 1;
      mapa.set(linha.diagnostico_id, atual);
    }

    const taxa = (parte: number, todo: number) =>
      todo === 0 ? 0 : Math.round((parte / todo) * 1000) / 10;

    const porDiagnostico = [...mapa.values()]
      .map((d) => ({
        ...d,
        taxaConclusao: taxa(d.concluidos, d.aberturas),
        taxaAbandono: taxa(d.aberturas - d.concluidos, d.aberturas),
      }))
      .sort((a, b) => b.aberturas - a.aberturas);

    const soma = porDiagnostico.reduce(
      (acc, d) => ({
        ...acc,
        aberturas: acc.aberturas + d.aberturas,
        iniciados: acc.iniciados + d.iniciados,
        dados: acc.dados + d.dados,
        concluidos: acc.concluidos + d.concluidos,
      }),
      {
        diagnosticoId: "total",
        titulo: "Todos os diagnósticos",
        aberturas: 0,
        iniciados: 0,
        dados: 0,
        concluidos: 0,
        taxaConclusao: 0,
        taxaAbandono: 0,
      } as FunilDiagnostico,
    );
    soma.taxaConclusao = taxa(soma.concluidos, soma.aberturas);
    soma.taxaAbandono = taxa(soma.aberturas - soma.concluidos, soma.aberturas);

    return { porDiagnostico, total: soma };
  });
