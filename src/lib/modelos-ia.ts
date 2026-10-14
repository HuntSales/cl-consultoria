export type ProvedorIA = "openai" | "anthropic";

export type ModeloIA = {
  id: string;
  rotulo: string;
  descricao: string;
  recomendado?: boolean;
};

export const MODELOS_IA: Record<ProvedorIA, ModeloIA[]> = {
  openai: [
    {
      id: "gpt-5.6-sol",
      rotulo: "GPT-5.6 Sol",
      descricao: "Máxima qualidade de análise e raciocínio.",
      recomendado: true,
    },
    {
      id: "gpt-5.6-terra",
      rotulo: "GPT-5.6 Terra",
      descricao: "Equilíbrio entre custo e qualidade no dia a dia.",
    },
    {
      id: "gpt-5.6-luna",
      rotulo: "GPT-5.6 Luna",
      descricao: "Rápido e econômico para pedidos simples.",
    },
    {
      id: "gpt-5.5",
      rotulo: "GPT-5.5",
      descricao: "Geração anterior, ainda muito capaz.",
    },
    {
      id: "gpt-4o",
      rotulo: "GPT-4o",
      descricao: "Modelo clássico, ampla compatibilidade.",
    },
  ],
  anthropic: [
    {
      id: "claude-sonnet-4-5",
      rotulo: "Claude Sonnet 4.5",
      descricao: "Melhor equilíbrio entre profundidade e velocidade.",
      recomendado: true,
    },
    {
      id: "claude-opus-4-1",
      rotulo: "Claude Opus 4.1",
      descricao: "Análises mais longas e complexas.",
    },
    {
      id: "claude-haiku-4-5",
      rotulo: "Claude Haiku 4.5",
      descricao: "Respostas rápidas e de baixo custo.",
    },
  ],
};

export const OUTRO_MODELO = "__outro__";

export function modeloRecomendado(provedor: ProvedorIA): string {
  const lista = MODELOS_IA[provedor];
  return (lista.find((m) => m.recomendado) ?? lista[0]).id;
}

export function ehModeloConhecido(provedor: ProvedorIA, modelo: string): boolean {
  return MODELOS_IA[provedor].some((m) => m.id === modelo);
}
