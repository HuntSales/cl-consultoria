/**
 * Motor de pontuação e seleção de perfil.
 * Módulo puro (sem acesso a banco) compartilhado entre o painel e o fluxo público,
 * para que a prévia do painel e o resultado real usem exatamente a mesma regra.
 */

export type Ramo = "comum" | "solteiro" | "casal";
export type ModoAtivacao = "faixa" | "regras" | "hibrido" | "dimensao";

export type RegraPerfil = { pergunta: number; opcoes: string[] };

export function normalizarRegras(valor: unknown): RegraPerfil[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      const pergunta = Number(r.pergunta);
      const opcoes = Array.isArray(r.opcoes)
        ? r.opcoes.filter((o): o is string => typeof o === "string").map((o) => o.trim().toUpperCase())
        : [];
      if (!Number.isFinite(pergunta) || pergunta < 1 || opcoes.length === 0) return null;
      return { pergunta, opcoes };
    })
    .filter((r): r is RegraPerfil => r !== null);
}

export function normalizarModoAtivacao(valor: unknown): ModoAtivacao {
  return valor === "faixa" || valor === "regras" || valor === "hibrido" || valor === "dimensao"
    ? valor
    : "hibrido";
}

export const MODO_ATIVACAO_LABEL: Record<ModoAtivacao, string> = {
  faixa: "Faixa de pontuação",
  regras: "Regras de resposta",
  hibrido: "Híbrido (regras + faixa)",
  dimensao: "Bloco de maior pontuação",
};

export type PerfilCandidato = {
  ordem: number;
  faixaMin: number;
  faixaMax: number;
  regras: RegraPerfil[];
  minRegras: number;
  modoAtivacao: ModoAtivacao;
  dimensaoId?: string | null;
};

export type EscolhaPerfil<T> = {
  perfil: T | null;
  criterio: "regras" | "faixa" | "dimensao" | null;
  regrasAtendidas: number;
};

export type DimensaoPontuada = { id: string; scorePercentual: number };

/**
 * Escolhe o perfil considerando o modo de ativação de cada um:
 * - "dimensao": vence o perfil ligado ao bloco (dimensão) de maior percentual;
 * - "regras": basta atingir o mínimo de regras;
 * - "hibrido": regras E score dentro da faixa (amarra perfil ao peso das perguntas);
 * - "faixa": apenas o score decide.
 * Desempate: maior aderência de regras → faixa de score → ordem.
 */
export function escolherPerfil<T extends PerfilCandidato>(
  perfis: T[],
  scorePercentual: number,
  letrasPorNumero: Map<number, string>,
  dimensoes: DimensaoPontuada[] = [],
): EscolhaPerfil<T> {
  const ordenados = perfis.slice().sort((a, b) => a.ordem - b.ordem);
  const naFaixa = (p: PerfilCandidato) =>
    scorePercentual >= Number(p.faixaMin) && scorePercentual <= Number(p.faixaMax);

  // Modo "dimensao": o bloco com maior percentual define o perfil.
  const porDimensao = ordenados.filter(
    (p) => normalizarModoAtivacao(p.modoAtivacao) === "dimensao" && p.dimensaoId,
  );
  if (porDimensao.length > 0 && dimensoes.length > 0) {
    const percentualPorDim = new Map(dimensoes.map((d) => [d.id, Number(d.scorePercentual) || 0]));
    let vencedor: T | null = null;
    let melhorPercentual = -1;
    for (const p of porDimensao) {
      const percentual = percentualPorDim.get(p.dimensaoId as string);
      if (percentual === undefined) continue;
      if (percentual > melhorPercentual) {
        melhorPercentual = percentual;
        vencedor = p;
      }
    }
    if (vencedor) return { perfil: vencedor, criterio: "dimensao", regrasAtendidas: 0 };
  }


  let melhor: T | null = null;
  let melhorAtendidas = 0;

  for (const p of ordenados) {
    const regras = normalizarRegras(p.regras);
    if (regras.length === 0) continue;
    const modo = normalizarModoAtivacao(p.modoAtivacao);
    if (modo === "faixa") continue;

    const atendidas = regras.filter((regra) => {
      const letra = letrasPorNumero.get(regra.pergunta);
      return !!letra && regra.opcoes.includes(letra);
    }).length;
    const minimo = Math.max(1, Number(p.minRegras) || 1);
    if (atendidas < minimo) continue;
    if (modo === "hibrido" && !naFaixa(p)) continue;

    if (atendidas > melhorAtendidas) {
      melhorAtendidas = atendidas;
      melhor = p;
    }
  }

  if (melhor) return { perfil: melhor, criterio: "regras", regrasAtendidas: melhorAtendidas };

  const porFaixa =
    ordenados.find((p) => naFaixa(p) && normalizarModoAtivacao(p.modoAtivacao) !== "regras") ??
    ordenados.find((p) => naFaixa(p)) ??
    null;

  return { perfil: porFaixa, criterio: porFaixa ? "faixa" : null, regrasAtendidas: 0 };
}

/* ─── Numeração das perguntas (base das regras) ─── */

type DimensaoNumeravel = {
  ordem: number;
  ramo?: Ramo | null;
  perguntas: { id: string; texto: string; ordem: number; ramifica?: boolean; opcoes?: { letra?: string | null }[] }[];
};

export type PerguntaNumerada = {
  numero: number;
  id: string;
  texto: string;
  letras: string[];
};

/**
 * Ordena dimensões do jeito que o motor usa: bloco comum primeiro, depois o ramo escolhido.
 */
export function ordenarDimensoes<T extends { ordem: number; ramo?: Ramo | null }>(dimensoes: T[], ramo?: Ramo | null): T[] {
  return dimensoes
    .slice()
    .filter((d) => {
      const r = (d.ramo ?? "comum") as Ramo;
      return r === "comum" || !ramo || r === ramo;
    })
    .sort((a, b) => {
      const ordemRamo = (r?: Ramo | null) => ((r ?? "comum") === "comum" ? 0 : 1);
      return ordemRamo(a.ramo) - ordemRamo(b.ramo) || a.ordem - b.ordem;
    });
}

/**
 * Numeração global das perguntas (1..N), ignorando a pergunta de ramificação —
 * é exatamente essa numeração que as regras dos perfis referenciam.
 */
export function numerarPerguntas(dimensoes: DimensaoNumeravel[], ramo?: Ramo | null): PerguntaNumerada[] {
  const lista: PerguntaNumerada[] = [];
  let numero = 0;
  for (const dim of ordenarDimensoes(dimensoes, ramo)) {
    for (const perg of dim.perguntas.slice().sort((a, b) => a.ordem - b.ordem)) {
      if (perg.ramifica) continue;
      numero += 1;
      lista.push({
        numero,
        id: perg.id,
        texto: perg.texto,
        letras: (perg.opcoes ?? [])
          .map((o) => (o.letra ?? "").trim().toUpperCase())
          .filter((l) => l.length > 0),
      });
    }
  }
  return lista;
}
