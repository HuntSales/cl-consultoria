import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, BriefcaseBusiness, ClipboardList, Inbox, KanbanSquare, LayoutDashboard, LogOut, Users } from "lucide-react";


import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { obterMeuAcesso } from "@/lib/acesso.functions";

export const Route = createFileRoute("/_authenticated/painel")({
  loader: async () => {
    const acesso = await obterMeuAcesso();
    if (acesso.status !== "aprovado") {
      throw redirect({ to: "/aguardando" });
    }
    return acesso;
  },
  component: PainelLayout,
});

function iniciais(nome: string, email: string) {
  const base = nome.trim() || email;
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function PainelLayout() {
  const acesso = Route.useLoaderData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/entrar", replace: true });
  }

  const itens = [
    { to: "/painel", label: "Visão geral", icone: LayoutDashboard, exact: true },
    { to: "/painel/diagnosticos", label: "Diagnósticos", icone: ClipboardList, exact: false },
    { to: "/painel/crm", label: "CRM", icone: KanbanSquare, exact: false },
    { to: "/painel/gestao", label: "Gestão de Clientes", icone: BriefcaseBusiness, exact: false },
    { to: "/painel/respostas", label: "Respostas", icone: Inbox, exact: false },
    { to: "/painel/analytics", label: "Analytics", icone: BarChart3, exact: false },
    ...(acesso.papel === "master_admin"
      ? [{ to: "/painel/usuarios", label: "Usuários", icone: Users, exact: false }]
      : []),
  ] as const;


  return (
    <div className="theme-painel flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="border-b border-border bg-sidebar md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent">Cibele Lucena</p>
            <p className="text-sm font-semibold uppercase tracking-wide">Painel</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
          {itens.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icone className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-secondary text-xs text-foreground">
                {iniciais(acesso.nomeCompleto, acesso.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {acesso.nomeCompleto || acesso.email}
              </p>
              <Badge variant="outline" className="mt-0.5 border-accent text-[10px] uppercase">
                {acesso.papel === "master_admin" ? "Administradora" : "Consultora"}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={sair} aria-label="Sair do painel">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Sair
          </Button>
        </header>

        <main className="flex-1 px-5 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
