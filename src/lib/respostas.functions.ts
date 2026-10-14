import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { escolherPerfil, normalizarModoAtivacao, normalizarRegras } from "@/lib/scoring";
import { apenasDigitosCpf, cpfValido } from "@/lib/cpf";

export type Ramo = "comum" | "solteiro" | "casal";

export type OpcaoPublica = { id: string; texto: string; letra: string | null; ramo: Ramo | null };


export type PerguntaPublica = {
  id: string;
  texto: string;
  obrigatoria: boolean;
  ramifica: boolean;
  opcoes: OpcaoPublica[];
};

export type DimensaoPublica = {
  id: string;
  titulo: string;
  descricao: string | null;
  ramo: Ramo;
  perguntas: PerguntaPublica[];
};

export type DiagnosticoPublico = {
  id: string;
  titulo: string;
  descricao: string | null;
  capaItens: string | null;
  slug: string;
  publico: string;
  dimensoes: DimensaoPublica[];
  totalPerguntas: number;
};


export type DimensaoResultado = {
  id: string;
  titulo: string;
  score: number;
  scoreMaximo: number;
  scorePercentual: number;
};

export type RotuloResultado = {
  pergunta: string;
  resposta: string;
  letra: string | null;
  rotulo: string | null;
  descricao: string | null;
};

export type Insights = {
  pontosFortes: string[];
  riscos: string[];
  proximosPassos: string[];
};

export type ResultadoResposta = {
  id: string;
  diagnosticoTitulo: string;
  diagnosticoSlug: string | null;
  nome: string;
  score: number;
  scoreMaximo: number;
  scorePercentual: number;
  perfilTitulo: string | null;
  perfilDescricao: string | null;
  perfilCor: string | null;
  ctaTexto: string | null;
  ctaUrl: string | null;
  linkAgendamento: string | null;
  rotulos: RotuloResultado[];
  dimensoes: DimensaoResultado[];
  distribuicao: import("./perfil-conteudo").FatiaPerfil[];
  perfilConteudo: import("./perfil-conteudo").ConteudoPerfil | null;
  insights: Insights | null;
  criadoEm: string;
};


export const obterDiagnosticoPublico = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }): Promise<DiagnosticoPublico | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: diagnostico, error } = await supabaseAdmin
      .from("diagnosticos")
      .select("id, titulo, descricao, capa_itens, slug, status, publico, dimensoes(id, titulo, descricao, ordem, ramo, perguntas(id, texto, ordem, obrigatoria, ramifica, opcoes_resposta(id, texto, ordem, letra, ramo)))")
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!diagnostico) return null;

    const publico = diagnostico.publico ?? "geral";

    const dimensoes: DimensaoPublica[] = (diagnostico.dimensoes ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((dim) => ({
        id: dim.id,
        titulo: dim.titulo,
        descricao: dim.descricao,
        ramo: (dim.ramo ?? "comum") as Ramo,
        perguntas: (dim.perguntas ?? [])
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map((perg) => ({
            id: perg.id,
            texto: perg.texto,
            obrigatoria: perg.obrigatoria,
            ramifica: perg.ramifica ?? false,
            opcoes: (perg.opcoes_resposta ?? [])
              .slice()
              .sort((a, b) => a.ordem - b.ordem)
              .map((opc) => ({
                id: opc.id,
                texto: opc.texto,
                letra: opc.letra ?? null,
                ramo: (opc.ramo ?? null) as Ramo | null,
              })),
          })),
      }))
      .filter((dim) => dim.perguntas.length > 0)
      // blocos comuns primeiro, depois os blocos exclusivos de cada ramo
      .sort((a, b) => (a.ramo === "comum" ? 0 : 1) - (b.ramo === "comum" ? 0 : 1));

    return {
      id: diagnostico.id,
      titulo: diagnostico.titulo,
      descricao: diagnostico.descricao,
      capaItens: diagnostico.capa_itens ?? null,
      slug: diagnostico.slug,
      publico,
      dimensoes,
      totalPerguntas: dimensoes
        .filter((d) => d.ramo === "comum")
        .reduce((acc, d) => acc + d.perguntas.length, 0),
    };

  });

const enviarRespostaInput = z.object({
  slug: z.string().min(1).max(200),
  nome: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().email("E-mail inválido.").max(255),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Informe seu WhatsApp com DDD.")
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 13, {
      message: "WhatsApp inválido. Use DDD + número.",
    }),
  cpf: z
    .string()
    .trim()
    .max(20)
    .refine((v) => cpfValido(v), { message: "CPF inválido." }),
  renda: z.string().trim().max(60).optional(),
  cargo: z.string().trim().max(60).optional(),
  estadoCivil: z.string().trim().max(30).optional(),
  consentimento: z.literal(true),
  origem: z.string().max(120).optional(),
  respostas: z
    .array(z.object({ perguntaId: z.string().uuid(), opcaoId: z.string().uuid() }))
    .min(1, "Responda ao menos uma pergunta."),
});

export const enviarResposta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => enviarRespostaInput.parse(input))
  .handler(async ({ data }): Promise<{ respostaId: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: diagnostico, error } = await supabaseAdmin
      .from("diagnosticos")
      .select("id, titulo, status, dimensoes(id, titulo, peso_dimensao, ordem, ramo, perguntas(id, texto, obrigatoria, ordem, ramifica, peso_pergunta, opcoes_resposta(id, texto, peso, ordem, letra, ramo, rotulo, rotulo_descricao))), perfis_resultado(id, titulo, descricao, cor, faixa_min, faixa_max, ordem, regras, min_regras, modo_ativacao, cta_texto, cta_url, ramo, dimensao_id)")

      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!diagnostico) throw new Error("Diagnóstico não encontrado ou não publicado.");

    const escolhas = new Map(data.respostas.map((r) => [r.perguntaId, r.opcaoId]));

    // ramo escolhido pela pergunta de ramificação (última do bloco comum)
    let ramoEscolhido: Ramo | null = null;
    for (const dim of diagnostico.dimensoes ?? []) {
      for (const perg of dim.perguntas ?? []) {
        if (!perg.ramifica) continue;
        const opcaoId = escolhas.get(perg.id);
        const opcao = (perg.opcoes_resposta ?? []).find((o) => o.id === opcaoId);
        if (opcao?.ramo && opcao.ramo !== "comum") ramoEscolhido = opcao.ramo as Ramo;
      }
    }

    let scoreTotal = 0;
    let scoreMaximoTotal = 0;
    const dimensoesResultado: DimensaoResultado[] = [];
    const rotulos: RotuloResultado[] = [];
    // letra escolhida por número global da pergunta (1..N), ignorando a pergunta de ramificação
    const letrasPorNumero = new Map<number, string>();
    let numeroPergunta = 0;

    const itens: {
      dimensao_id: string;
      dimensao_titulo: string;
      pergunta_id: string;
      pergunta_texto: string;
      opcao_id: string;
      opcao_texto: string;
      peso_aplicado: number;
    }[] = [];

    const dimensoesOrdenadas = (diagnostico.dimensoes ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      // só o bloco comum e o bloco do ramo escolhido entram no cálculo
      .filter((dim) => {
        const ramoDim = (dim.ramo ?? "comum") as Ramo;
        return ramoDim === "comum" || ramoDim === ramoEscolhido;
      })
      .sort((a, b) => {
        const ordemRamo = (r: string) => ((r ?? "comum") === "comum" ? 0 : 1);
        return ordemRamo(a.ramo) - ordemRamo(b.ramo) || a.ordem - b.ordem;
      });

    for (const dim of dimensoesOrdenadas) {
      const peso = Number(dim.peso_dimensao) || 1;
      let scoreDim = 0;
      let maxDim = 0;

      const perguntasOrdenadas = (dim.perguntas ?? []).slice().sort((a, b) => a.ordem - b.ordem);

      for (const perg of perguntasOrdenadas) {
        const opcoes = perg.opcoes_resposta ?? [];
        if (opcoes.length === 0) continue;

        const opcaoId = escolhas.get(perg.id);

        // a pergunta de ramificação não pontua e não entra na numeração das regras
        if (perg.ramifica) {
          if (!opcaoId) throw new Error("Responda todas as perguntas obrigatórias.");
          const opcaoRamo = opcoes.find((o) => o.id === opcaoId);
          if (!opcaoRamo) throw new Error("Opção de resposta inválida.");
          itens.push({
            dimensao_id: dim.id,
            dimensao_titulo: dim.titulo,
            pergunta_id: perg.id,
            pergunta_texto: perg.texto,
            opcao_id: opcaoRamo.id,
            opcao_texto: opcaoRamo.texto,
            peso_aplicado: 0,
          });
          continue;
        }

        const pesoPergunta = Number(perg.peso_pergunta ?? 1) || 1;
        numeroPergunta += 1;
        maxDim += Math.max(...opcoes.map((o) => Number(o.peso) || 0), 0) * pesoPergunta;

        if (!opcaoId) {
          if (perg.obrigatoria) throw new Error("Responda todas as perguntas obrigatórias.");
          continue;
        }
        const opcao = opcoes.find((o) => o.id === opcaoId);
        if (!opcao) throw new Error("Opção de resposta inválida.");

        if (opcao.letra) letrasPorNumero.set(numeroPergunta, opcao.letra.trim().toUpperCase());
        rotulos.push({
          pergunta: perg.texto,
          resposta: opcao.texto,
          letra: opcao.letra ?? null,
          rotulo: opcao.rotulo ?? null,
          descricao: opcao.rotulo_descricao ?? null,
        });

        const pesoAplicado = (Number(opcao.peso) || 0) * pesoPergunta;
        scoreDim += pesoAplicado;
        itens.push({
          dimensao_id: dim.id,
          dimensao_titulo: dim.titulo,
          pergunta_id: perg.id,
          pergunta_texto: perg.texto,
          opcao_id: opcao.id,
          opcao_texto: opcao.texto,
          peso_aplicado: pesoAplicado,
        });
      }

      if (maxDim === 0) continue;

      scoreTotal += scoreDim * peso;
      scoreMaximoTotal += maxDim * peso;
      dimensoesResultado.push({
        id: dim.id,
        titulo: dim.titulo,
        score: scoreDim,
        scoreMaximo: maxDim,
        scorePercentual: maxDim > 0 ? Math.round((scoreDim / maxDim) * 100) : 0,
      });
    }

    const scorePercentual = scoreMaximoTotal > 0 ? Math.round((scoreTotal / scoreMaximoTotal) * 100) : 0;

    const perfisOrdenados = (diagnostico.perfis_resultado ?? [])
      .slice()
      // perfis do outro ramo não podem ser ativados
      .filter((p) => {
        const ramoPerfil = (p.ramo ?? "comum") as Ramo;
        return ramoPerfil === "comum" || ramoPerfil === (ramoEscolhido ?? "solteiro");
      })
      .map((p) => ({
        ...p,
        regras: normalizarRegras(p.regras),
        minRegras: Number(p.min_regras) || 1,
        faixaMin: Number(p.faixa_min),
        faixaMax: Number(p.faixa_max),
        modoAtivacao: normalizarModoAtivacao(p.modo_ativacao),
        dimensaoId: (p as { dimensao_id?: string | null }).dimensao_id ?? null,
      }));

    // regras + faixa de pontuação, conforme o modo de ativação de cada perfil
    const { perfil } = escolherPerfil(
      perfisOrdenados,
      scorePercentual,
      letrasPorNumero,
      dimensoesResultado.map((d) => ({ id: d.id, scorePercentual: d.scorePercentual })),
    );


    const { data: criada, error: erroInsert } = await supabaseAdmin
      .from("respostas_diagnostico")
      .insert({
        diagnostico_id: diagnostico.id,
        diagnostico_titulo: diagnostico.titulo,
        ramo: ramoEscolhido ?? "solteiro",

        nome: data.nome,
        email: data.email.toLowerCase(),
        whatsapp: data.whatsapp || null,
        cpf: apenasDigitosCpf(data.cpf),
        renda: data.renda || null,
        cargo: data.cargo || null,
        estado_civil: data.estadoCivil || null,
        consentimento: true,
        score: scoreTotal,
        score_maximo: scoreMaximoTotal,
        score_percentual: scorePercentual,
        perfil_id: perfil?.id ?? null,
        perfil_titulo: perfil?.titulo ?? null,
        perfil_descricao: perfil?.descricao ?? null,
        perfil_cor: perfil?.cor ?? null,
        dimensoes_resultado: dimensoesResultado,
        rotulos,
        origem: data.origem || null,
      })
      .select("id")
      .single();

    if (erroInsert) throw new Error(erroInsert.message);

    if (itens.length > 0) {
      const { error: erroItens } = await supabaseAdmin
        .from("respostas_itens")
        .insert(itens.map((i) => ({ ...i, resposta_id: criada.id })));
      if (erroItens) throw new Error(erroItens.message);
    }

    // Envia a devolutiva por e-mail sem bloquear a conclusão do diagnóstico
    try {
      const { enfileirarDevolutiva } = await import("@/lib/email/devolutiva-email.server");
      const envio = await enfileirarDevolutiva(criada.id);
      if (!envio.ok) console.error("Devolutiva não enviada:", envio.motivo);
    } catch (erroEmail) {
      console.error("Falha ao enviar devolutiva:", erroEmail instanceof Error ? erroEmail.message : erroEmail);
    }

    return { respostaId: criada.id };
  });


function normalizarInsights(valor: unknown): Insights | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const lista = (x: unknown) =>
    Array.isArray(x) ? x.filter((i): i is string => typeof i === "string" && i.trim().length > 0).slice(0, 5) : [];
  const insights = {
    pontosFortes: lista(v.pontosFortes),
    riscos: lista(v.riscos),
    proximosPassos: lista(v.proximosPassos),
  };
  if (!insights.pontosFortes.length && !insights.riscos.length && !insights.proximosPassos.length) return null;
  return insights;
}

export const obterResultado = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<ResultadoResposta | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: resposta, error } = await supabaseAdmin
      .from("respostas_diagnostico")
      .select("id, diagnostico_id, diagnostico_titulo, nome, score, score_maximo, score_percentual, perfil_id, perfil_titulo, perfil_descricao, perfil_cor, dimensoes_resultado, rotulos, insights, criado_em, diagnosticos(slug, link_agendamento)")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!resposta) return null;

    const dims = Array.isArray(resposta.dimensoes_resultado)
      ? (resposta.dimensoes_resultado as unknown as DimensaoResultado[])
      : [];
    const rotulos = Array.isArray(resposta.rotulos)
      ? (resposta.rotulos as unknown as RotuloResultado[])
      : [];

    const { calcularDistribuicaoPerfis, normalizarConteudoPerfil } = await import("./perfil-conteudo");

    const { data: perfis } = await supabaseAdmin
      .from("perfis_resultado")
      .select("id, cor, cta_texto, cta_url, dimensao_id, conteudo")
      .eq("diagnostico_id", resposta.diagnostico_id);

    const cores: Record<string, string | null> = {};
    for (const p of perfis ?? []) {
      if (p.dimensao_id) cores[p.dimensao_id] = p.cor;
    }
    const perfilAtual = (perfis ?? []).find((p) => p.id === resposta.perfil_id) ?? null;

    return {
      id: resposta.id,
      diagnosticoTitulo: resposta.diagnostico_titulo,
      diagnosticoSlug: (resposta.diagnosticos as { slug: string } | null)?.slug ?? null,
      linkAgendamento:
        (resposta.diagnosticos as { link_agendamento: string | null } | null)?.link_agendamento ?? null,
      nome: resposta.nome,
      score: Number(resposta.score),
      scoreMaximo: Number(resposta.score_maximo),
      scorePercentual: Number(resposta.score_percentual),
      perfilTitulo: resposta.perfil_titulo,
      perfilDescricao: resposta.perfil_descricao,
      perfilCor: resposta.perfil_cor,
      ctaTexto: perfilAtual?.cta_texto ?? null,
      ctaUrl: perfilAtual?.cta_url ?? null,
      rotulos,
      dimensoes: dims,
      distribuicao: calcularDistribuicaoPerfis(dims, cores),
      perfilConteudo: normalizarConteudoPerfil(perfilAtual?.conteudo),
      insights: normalizarInsights(resposta.insights),
      criadoEm: resposta.criado_em,
    };

  });

function insightsFallback(percentual: number, dims: DimensaoResultado[]): Insights {
  const ordenadas = dims.slice().sort((a, b) => b.scorePercentual - a.scorePercentual);
  const melhores = ordenadas.slice(0, 2);
  const piores = ordenadas.slice(-2).reverse();
  return {
    pontosFortes: melhores.length
      ? melhores.map((d) => `${d.titulo}: desempenho de ${d.scorePercentual}% — mantenha o que já funciona aqui.`)
      : [`Você concluiu o diagnóstico com ${percentual}% de aproveitamento.`],
    riscos: piores.length
      ? piores.map((d) => `${d.titulo}: apenas ${d.scorePercentual}% — este é o ponto que mais limita seus resultados.`)
      : ["Há espaço para organizar melhor sua rotina financeira."],
    proximosPassos: [
      "Reserve 30 minutos para revisar as dimensões com menor pontuação.",
      "Defina uma única prioridade financeira para os próximos 30 dias.",
      "Agende uma devolutiva para transformar o diagnóstico em plano de ação.",
    ],
  };
}

export const gerarInsights = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ respostaId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<Insights> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: resposta, error } = await supabaseAdmin
      .from("respostas_diagnostico")
      .select("id, diagnostico_titulo, nome, score_percentual, perfil_titulo, perfil_descricao, dimensoes_resultado, insights")
      .eq("id", data.respostaId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!resposta) throw new Error("Resultado não encontrado.");

    const existentes = normalizarInsights(resposta.insights);
    if (existentes) return existentes;

    const dims = Array.isArray(resposta.dimensoes_resultado)
      ? (resposta.dimensoes_resultado as unknown as DimensaoResultado[])
      : [];
    const percentual = Number(resposta.score_percentual);

    const { data: itens } = await supabaseAdmin
      .from("respostas_itens")
      .select("dimensao_titulo, pergunta_texto, opcao_texto")
      .eq("resposta_id", resposta.id);

    let insights: Insights = insightsFallback(percentual, dims);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const { generateText, Output } = await import("ai");
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(apiKey, { structuredOutputs: true });

        const contexto = [
          `Diagnóstico: ${resposta.diagnostico_titulo}`,
          `Pontuação geral: ${percentual}%`,
          resposta.perfil_titulo ? `Perfil identificado: ${resposta.perfil_titulo}` : null,
          resposta.perfil_descricao ? `Descrição do perfil: ${resposta.perfil_descricao}` : null,
          "",
          "Resultado por dimensão:",
          ...dims.map((d) => `- ${d.titulo}: ${d.scorePercentual}%`),
          "",
          "Respostas escolhidas:",
          ...(itens ?? []).map((i) => `- [${i.dimensao_titulo}] ${i.pergunta_texto} → ${i.opcao_texto}`),
        ]
          .filter(Boolean)
          .join("\n");

        const { output } = await generateText({
          model: gateway("openai/gpt-5.5"),
          output: Output.object({
            schema: z.object({
              pontosFortes: z.array(z.string()),
              riscos: z.array(z.string()),
              proximosPassos: z.array(z.string()),
            }),
          }),
          system:
            "Você é consultora financeira comportamental sênior, escrevendo em português do Brasil para um público de médio e alto poder aquisitivo. Tom consultivo, elegante, direto, sem jargão e sem promessas de rentabilidade. Fale diretamente com a pessoa (você).",
          prompt: `${contexto}\n\nCom base nesse diagnóstico, gere exatamente 3 pontos fortes, 3 riscos e 3 próximos passos práticos. Cada item deve ser uma frase de no máximo 220 caracteres, específica e baseada nos dados acima.`,
        });

        const normalizado = normalizarInsights(output);
        if (normalizado) {
          insights = {
            pontosFortes: normalizado.pontosFortes.slice(0, 3),
            riscos: normalizado.riscos.slice(0, 3),
            proximosPassos: normalizado.proximosPassos.slice(0, 3),
          };
        }
      } catch (erroIa) {
        // mantém o fallback textual: o resultado nunca fica em branco
        console.error("Falha ao gerar insights de IA:", erroIa instanceof Error ? erroIa.message : erroIa);
      }
    }

    await supabaseAdmin
      .from("respostas_diagnostico")
      .update({ insights })
      .eq("id", resposta.id);

    return insights;
  });
