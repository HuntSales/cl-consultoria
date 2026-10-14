import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Papel = "master_admin" | "consultor";
export type Situacao = "pendente" | "aprovado" | "bloqueado";

export type MeuAcesso = {
  userId: string;
  nomeCompleto: string;
  email: string;
  avatarUrl: string | null;
  status: Situacao;
  papel: Papel;
};

export type UsuarioPainel = {
  id: string;
  nomeCompleto: string;
  email: string;
  avatarUrl: string | null;
  status: Situacao;
  papel: Papel;
  criadoEm: string;
};

export const obterMeuAcesso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MeuAcesso> => {
    const { data: perfil, error } = await context.supabase
      .from("profiles")
      .select("id, nome_completo, email, avatar_url, status")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!perfil) throw new Error("Perfil não encontrado.");

    const { data: papeis } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const papel: Papel = papeis?.some((p) => p.role === "master_admin")
      ? "master_admin"
      : "consultor";

    return {
      userId: perfil.id,
      nomeCompleto: perfil.nome_completo,
      email: perfil.email,
      avatarUrl: perfil.avatar_url,
      status: perfil.status,
      papel,
    };
  });

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioPainel[]> => {
    const { data: eMaster } = await context.supabase.rpc("is_master_admin");
    if (!eMaster) throw new Error("Acesso restrito à administradora principal.");

    const { data: perfis, error } = await context.supabase
      .from("profiles")
      .select("id, nome_completo, email, avatar_url, status, criado_em")
      .order("criado_em", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: papeis } = await context.supabase.from("user_roles").select("user_id, role");
    const mapa = new Map<string, Papel>();
    for (const p of papeis ?? []) {
      if (p.role === "master_admin") mapa.set(p.user_id, "master_admin");
      else if (!mapa.has(p.user_id)) mapa.set(p.user_id, "consultor");
    }

    return (perfis ?? []).map((p) => ({
      id: p.id,
      nomeCompleto: p.nome_completo,
      email: p.email,
      avatarUrl: p.avatar_url,
      status: p.status,
      papel: mapa.get(p.id) ?? "consultor",
      criadoEm: p.criado_em,
    }));
  });

const alterarStatusInput = z.object({
  usuarioId: z.string().uuid(),
  status: z.enum(["pendente", "aprovado", "bloqueado"]),
});

export const alterarStatusUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => alterarStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: eMaster } = await context.supabase.rpc("is_master_admin");
    if (!eMaster) throw new Error("Acesso restrito à administradora principal.");
    if (data.usuarioId === context.userId) {
      throw new Error("Você não pode alterar a sua própria situação.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        status: data.status,
        aprovado_em: data.status === "aprovado" ? new Date().toISOString() : null,
        aprovado_por: data.status === "aprovado" ? context.userId : null,
      })
      .eq("id", data.usuarioId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

const alterarPapelInput = z.object({
  usuarioId: z.string().uuid(),
  papel: z.enum(["master_admin", "consultor"]),
});

export const alterarPapelUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => alterarPapelInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: eMaster } = await context.supabase.rpc("is_master_admin");
    if (!eMaster) throw new Error("Acesso restrito à administradora principal.");
    if (data.usuarioId === context.userId) {
      throw new Error("Você não pode alterar o seu próprio papel.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: erroLimpeza } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.usuarioId);
    if (erroLimpeza) throw new Error(erroLimpeza.message);

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.usuarioId, role: data.papel });
    if (error) throw new Error(error.message);

    return { ok: true };
  });
