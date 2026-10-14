import { createFileRoute } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/painel/")({
  component: VisaoGeralPage,
});

function VisaoGeralPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Visão geral</p>
        <h1 className="mt-2 text-2xl font-semibold uppercase">Bem-vinda ao painel</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Este é o ponto de partida da área de diagnóstico financeiro. Nas próximas etapas entram o
          construtor de diagnósticos, o questionário público, a devolutiva e o CRM.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnósticos</CardTitle>
            <CardDescription>Construtor de perguntas, pesos e perfis.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Disponível na Fase 2.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads e CRM</CardTitle>
            <CardDescription>Funis, etapas e acompanhamento.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Disponível na Fase 4.</CardContent>
        </Card>
      </div>
    </div>
  );
}
