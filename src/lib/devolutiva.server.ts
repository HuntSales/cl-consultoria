import type { DimensaoResultado } from "./respostas.functions";

export type AcaoPlano = { prazo: "30 dias" | "60 dias" | "90 dias"; acao: string };

export type Devolutiva = {
  focoPrincipal: string;
  pontosAbordar: string[];
  perguntasAprofundamento: string[];
  alertas: string[];
  planoAcao: AcaoPlano[];
  geradoEm: string;
};

const PRAZOS: AcaoPlano["prazo"][] = ["30 dias", "60 dias", "90 dias"];

function listaTexto(valor: unknown, max: number): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    .map((i) => i.trim().slice(0, 400))
    .slice(0, max);
}

export function normalizarDevolutiva(valor: unknown): Devolutiva | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;

  const planoBruto = Array.isArray(v.planoAcao) ? v.planoAcao : [];
  const planoAcao: AcaoPlano[] = planoBruto
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const acao = typeof o.acao === "string" ? o.acao.trim().slice(0, 400) : "";
      if (!acao) return null;
      const prazoBruto = typeof o.prazo === "string" ? o.prazo.trim() : "";
      const prazo = PRAZOS.find((p) => prazoBruto.includes(p.split(" ")[0])) ?? "30 dias";
      return { prazo, acao } satisfies AcaoPlano;
    })
    .filter((i): i is AcaoPlano => i !== null)
    .slice(0, 9);

  const devolutiva: Devolutiva = {
    focoPrincipal: typeof v.focoPrincipal === "string" ? v.focoPrincipal.trim().slice(0, 900) : "",
    pontosAbordar: listaTexto(v.pontosAbordar, 5),
    perguntasAprofundamento: listaTexto(v.perguntasAprofundamento, 5),
    alertas: listaTexto(v.alertas, 4),
    planoAcao,
    geradoEm: typeof v.geradoEm === "string" ? v.geradoEm : new Date().toISOString(),
  };

  if (
    !devolutiva.focoPrincipal &&
    devolutiva.pontosAbordar.length === 0 &&
    devolutiva.planoAcao.length === 0
  ) {
    return null;
  }
  return devolutiva;
}

export function devolutivaFallback(
  nome: string,
  percentual: number,
  perfilTitulo: string | null,
  dims: DimensaoResultado[],
): Devolutiva {
  const ordenadas = dims.slice().sort((a, b) => a.scorePercentual - b.scorePercentual);
  const fracas = ordenadas.slice(0, 2);
  const fortes = ordenadas.slice(-2).reverse();
  const primeiroNome = nome.split(" ")[0];

  return {
    focoPrincipal: `${primeiroNome} atingiu ${percentual}% de aproveitamento${
      perfilTitulo ? ` e foi classificada no perfil "${perfilTitulo}"` : ""
    }. O foco da devolutiva deve ser ${
      fracas[0] ? `a dimensão "${fracas[0].titulo}" (${fracas[0].scorePercentual}%)` : "a organização da rotina financeira"
    }, conectando o comportamento atual às consequências práticas no fluxo de caixa e nas decisões de médio prazo.`,
    pontosAbordar: [
      ...fracas.map((d) => `${d.titulo}: ${d.scorePercentual}% — investigar o que trava o avanço nessa dimensão.`),
      ...fortes.map((d) => `${d.titulo}: ${d.scorePercentual}% — usar como âncora de confiança durante a conversa.`),
      "Alinhar expectativas sobre prazo e esforço necessários para mudar o cenário.",
    ].slice(0, 5),
    perguntasAprofundamento: [
      "O que costuma acontecer quando o dinheiro aperta no fim do mês?",
      "Qual decisão financeira recente você repetiria e qual mudaria?",
      "Quem participa das decisões financeiras hoje e como isso é combinado?",
    ],
    alertas: [
      "Evite julgar escolhas passadas: a leitura é comportamental, não moral.",
      "Confirme os dados de renda e compromissos antes de sugerir valores.",
    ],
    planoAcao: [
      { prazo: "30 dias", acao: "Mapear entradas, saídas e dívidas em um único painel de controle." },
      { prazo: "60 dias", acao: `Estruturar uma rotina de revisão quinzenal focada em ${fracas[0]?.titulo ?? "organização financeira"}.` },
      { prazo: "90 dias", acao: "Definir e iniciar a primeira meta financeira com valor e prazo determinados." },
    ],
    geradoEm: new Date().toISOString(),
  };
}

export function montarContexto(params: {
  diagnosticoTitulo: string;
  nome: string;
  percentual: number;
  perfilTitulo: string | null;
  perfilDescricao: string | null;
  dims: DimensaoResultado[];
  itens: { dimensao_titulo: string | null; pergunta_texto: string; opcao_texto: string }[];
}) {
  return [
    `Diagnóstico: ${params.diagnosticoTitulo}`,
    `Nome do respondente: ${params.nome}`,
    `Pontuação geral: ${params.percentual}%`,
    params.perfilTitulo ? `Perfil identificado: ${params.perfilTitulo}` : null,
    params.perfilDescricao ? `Descrição do perfil: ${params.perfilDescricao}` : null,
    "",
    "Resultado por dimensão:",
    ...params.dims.map((d) => `- ${d.titulo}: ${d.scorePercentual}%`),
    "",
    "Respostas escolhidas:",
    ...params.itens.map((i) => `- [${i.dimensao_titulo ?? "Geral"}] ${i.pergunta_texto} → ${i.opcao_texto}`),
  ]
    .filter(Boolean)
    .join("\n");
}
