import type { DimensaoResultado } from "./respostas.functions";

export type ConteudoPerfil = {
  comoSeRelaciona: string;
  interpretacao: string;
  crencas: string[];
  pontosFortes: string[];
  pontosMelhoria: string[];
  riscos: string[];
  estrategias: string[];
};

export type FatiaPerfil = {
  id: string;
  titulo: string;
  pontos: number;
  percentual: number;
  cor: string;
};

const PALETA_FALLBACK = [
  "#3b6bd6",
  "#4aa8e0",
  "#2f9e4f",
  "#f2d024",
  "#f0913c",
  "#e0402c",
  "#8e44ad",
  "#284356",
];

function lista(valor: unknown, max = 8): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    .map((i) => i.trim())
    .slice(0, max);
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export function normalizarConteudoPerfil(valor: unknown): ConteudoPerfil | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const conteudo: ConteudoPerfil = {
    comoSeRelaciona: texto(v.comoSeRelaciona),
    interpretacao: texto(v.interpretacao),
    crencas: lista(v.crencas),
    pontosFortes: lista(v.pontosFortes),
    pontosMelhoria: lista(v.pontosMelhoria),
    riscos: lista(v.riscos),
    estrategias: lista(v.estrategias),
  };
  const vazio =
    !conteudo.comoSeRelaciona &&
    !conteudo.interpretacao &&
    conteudo.crencas.length === 0 &&
    conteudo.pontosFortes.length === 0 &&
    conteudo.pontosMelhoria.length === 0 &&
    conteudo.riscos.length === 0 &&
    conteudo.estrategias.length === 0;
  return vazio ? null : conteudo;
}

/**
 * Participação de cada dimensão/perfil no total de pontos do respondente.
 * Os percentuais são arredondados fechando exatamente 100%.
 */
export function calcularDistribuicaoPerfis(
  dimensoes: DimensaoResultado[],
  coresPorDimensao: Record<string, string | null | undefined> = {},
): FatiaPerfil[] {
  const validas = dimensoes.filter((d) => Number(d.score) > 0);
  const total = validas.reduce((soma, d) => soma + Number(d.score), 0);
  if (validas.length === 0 || total <= 0) return [];

  const brutos = validas.map((d, i) => {
    const exato = (Number(d.score) / total) * 100;
    return {
      id: d.id,
      titulo: d.titulo,
      pontos: Number(d.score),
      cor: coresPorDimensao[d.id] || PALETA_FALLBACK[i % PALETA_FALLBACK.length],
      exato,
      base: Math.floor(exato),
    };
  });

  let restante = 100 - brutos.reduce((s, b) => s + b.base, 0);
  const ordemResto = brutos
    .map((b, i) => ({ i, resto: b.exato - b.base }))
    .sort((a, b) => b.resto - a.resto);
  const extra = new Set<number>();
  for (const item of ordemResto) {
    if (restante <= 0) break;
    extra.add(item.i);
    restante -= 1;
  }

  return brutos
    .map((b, i) => ({
      id: b.id,
      titulo: b.titulo,
      pontos: b.pontos,
      cor: b.cor,
      percentual: b.base + (extra.has(i) ? 1 : 0),
    }))
    .sort((a, b) => b.percentual - a.percentual);
}
