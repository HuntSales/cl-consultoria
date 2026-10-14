import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DimensaoResultado } from "./respostas.functions";
import type { Devolutiva } from "./devolutiva.server";

export type { Devolutiva, AcaoPlano } from "./devolutiva.server";

export const gerarDevolutiva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ respostaId: z.string().uuid(), forcar: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<Devolutiva> => {
    const { normalizarDevolutiva, devolutivaFallback, montarContexto } = await import("./devolutiva.server");

    const { data: resposta, error } = await context.supabase
      .from("respostas_diagnostico")
      .select(
        "id, diagnostico_titulo, nome, score_percentual, perfil_titulo, perfil_descricao, dimensoes_resultado, devolutiva",
      )
      .eq("id", data.respostaId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!resposta) throw new Error("Resposta não encontrada.");

    if (!data.forcar) {
      const existente = normalizarDevolutiva(resposta.devolutiva);
      if (existente) return existente;
    }

    const dims = Array.isArray(resposta.dimensoes_resultado)
      ? (resposta.dimensoes_resultado as unknown as DimensaoResultado[])
      : [];
    const percentual = Number(resposta.score_percentual);

    const { data: itens } = await context.supabase
      .from("respostas_itens")
      .select("dimensao_titulo, pergunta_texto, opcao_texto")
      .eq("resposta_id", resposta.id);

    let devolutiva = devolutivaFallback(resposta.nome, percentual, resposta.perfil_titulo, dims);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const { generateText, Output, NoObjectGeneratedError } = await import("ai");
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(apiKey, { structuredOutputs: true });

        const contexto = montarContexto({
          diagnosticoTitulo: resposta.diagnostico_titulo,
          nome: resposta.nome,
          percentual,
          perfilTitulo: resposta.perfil_titulo,
          perfilDescricao: resposta.perfil_descricao,
          dims,
          itens: itens ?? [],
        });

        const schema = z.object({
          focoPrincipal: z.string(),
          pontosAbordar: z.array(z.string()),
          perguntasAprofundamento: z.array(z.string()),
          alertas: z.array(z.string()),
          planoAcao: z.array(z.object({ prazo: z.string(), acao: z.string() })),
        });

        const prompt = `${contexto}

Você está preparando o briefing interno da consultora para a sessão de devolutiva desta pessoa.
Gere:
- focoPrincipal: um parágrafo de no máximo 700 caracteres dizendo qual deve ser o foco central da conversa e por quê, citando dados do diagnóstico.
- pontosAbordar: 4 tópicos objetivos (até 220 caracteres cada) do que precisa ser abordado.
- perguntasAprofundamento: 4 perguntas abertas para a consultora fazer na sessão.
- alertas: 3 cuidados de abordagem, incluindo vieses e sensibilidades identificadas nas respostas.
- planoAcao: 6 ações, cada uma com "prazo" sendo exatamente "30 dias", "60 dias" ou "90 dias", e "acao" descrevendo o passo prático (até 220 caracteres).
Escreva em português do Brasil, tom consultivo e direto, sem promessas de rentabilidade. Fale da pessoa na terceira pessoa (é um material interno da consultora).`;

        try {
          const { output } = await generateText({
            model: gateway("openai/gpt-5.5"),
            output: Output.object({ schema }),
            system:
              "Você é consultora financeira comportamental sênior. Produz briefings internos objetivos para sessões de devolutiva com clientes de médio e alto poder aquisitivo.",
            prompt,
          });
          const normalizado = normalizarDevolutiva({ ...output, geradoEm: new Date().toISOString() });
          if (normalizado) devolutiva = normalizado;
        } catch (erro) {
          if (NoObjectGeneratedError.isInstance(erro)) {
            try {
              const bruto = JSON.parse(erro.text ?? "{}");
              const normalizado = normalizarDevolutiva({ ...bruto, geradoEm: new Date().toISOString() });
              if (normalizado) devolutiva = normalizado;
            } catch {
              // mantém o fallback
            }
          } else {
            throw erro;
          }
        }
      } catch (erroIa) {
        console.error("Falha ao gerar devolutiva:", erroIa instanceof Error ? erroIa.message : erroIa);
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: erroUpdate } = await supabaseAdmin
      .from("respostas_diagnostico")
      .update({ devolutiva })
      .eq("id", resposta.id);
    if (erroUpdate) console.error("Falha ao salvar devolutiva:", erroUpdate.message);

    return devolutiva;
  });

export const obterDevolutiva = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ respostaId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<Devolutiva | null> => {
    const { normalizarDevolutiva } = await import("./devolutiva.server");
    const { data: resposta, error } = await context.supabase
      .from("respostas_diagnostico")
      .select("devolutiva")
      .eq("id", data.respostaId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizarDevolutiva(resposta?.devolutiva);
  });
