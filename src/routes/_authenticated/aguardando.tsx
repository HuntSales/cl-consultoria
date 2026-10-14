import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { obterMeuAcesso } from "@/lib/acesso.functions";

export const Route = createFileRoute("/_authenticated/aguardando")({
  component: AguardandoPage,
});

function AguardandoPage() {
  const navigate = useNavigate();
  const buscarAcesso = useServerFn(obterMeuAcesso);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["meu-acesso"],
    queryFn: () => buscarAcesso(),
  });

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/entrar", replace: true });
  }

  const bloqueado = data?.status === "bloqueado";

  return (
    <div className="theme-painel flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="mx-auto h-4 w-32" />
            <Skeleton className="mx-auto h-7 w-64" />
            <Skeleton className="mx-auto h-16 w-full" />
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">
              {bloqueado ? "Acesso bloqueado" : "Acesso em análise"}
            </p>
            <h1 className="mt-3 text-2xl font-semibold uppercase text-foreground">
              {bloqueado ? "Seu acesso está suspenso" : "Aguardando aprovação"}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {bloqueado
                ? "Seu acesso ao painel foi suspenso pela administradora da conta. Fale com ela para entender os próximos passos."
                : "Sua conta foi criada. A administradora da conta precisa liberar o seu acesso ao painel. Você receberá o acesso assim que isso acontecer."}
            </p>
            {data ? (
              <p className="mt-6 text-xs text-muted-foreground">
                Conectado como {data.email}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? "Verificando..." : "Verificar novamente"}
              </Button>
              <Button variant="outline" onClick={sair}>
                Sair
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
