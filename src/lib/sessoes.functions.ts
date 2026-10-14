import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const marcoInput = z.object({
  slug: z.string().min(1).max(200),
  sessaoKey: z.string().uuid(),
  marco: z.enum(["aberto", "iniciado", "dados", "concluido"]),
  respostaId: z.string().uuid().optional(),
  origem: z.string().max(200).optional(),
});

export const registrarMarcoSessao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => marcoInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: diagnostico } = await supabaseAdmin
      .from("diagnosticos")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!diagnostico) return { ok: false };

    const agora = new Date().toISOString();

    if (data.marco === "aberto") {
      await supabaseAdmin
        .from("diagnostico_sessoes")
        .upsert(
          {
            diagnostico_id: diagnostico.id,
            sessao_key: data.sessaoKey,
            aberto_em: agora,
            origem: data.origem ?? null,
          },
          { onConflict: "diagnostico_id,sessao_key", ignoreDuplicates: true },
        );
      return { ok: true };
    }

    const campo =
      data.marco === "iniciado" ? "iniciado_em" : data.marco === "dados" ? "dados_em" : "concluido_em";

    const patch: {
      iniciado_em?: string;
      dados_em?: string;
      concluido_em?: string;
      resposta_id?: string;
    } = { [campo]: agora };
    if (data.marco === "concluido" && data.respostaId) patch.resposta_id = data.respostaId;

    const { data: existente } = await supabaseAdmin
      .from("diagnostico_sessoes")
      .select("id, iniciado_em, dados_em, concluido_em")
      .eq("diagnostico_id", diagnostico.id)
      .eq("sessao_key", data.sessaoKey)
      .maybeSingle();

    if (!existente) {
      await supabaseAdmin.from("diagnostico_sessoes").insert({
        diagnostico_id: diagnostico.id,
        sessao_key: data.sessaoKey,
        aberto_em: agora,
        origem: data.origem ?? null,
        ...patch,
      });
      return { ok: true };
    }

    // não sobrescreve marcos já registrados (evita inflar por voltar etapas)
    if ((existente as Record<string, unknown>)[campo]) return { ok: true };

    await supabaseAdmin.from("diagnostico_sessoes").update(patch).eq("id", existente.id);
    return { ok: true };
  });
