import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, AlertTriangle, CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PerfilConteudo } from "@/components/diagnostico/PerfilConteudo";
import { PerfilDistribuicao } from "@/components/diagnostico/PerfilDistribuicao";
import type { ResultadoResposta } from "@/lib/respostas.functions";
import { gerarInsights, obterResultado } from "@/lib/respostas.functions";


export const Route = createFileRoute("/d/$slug_/r/$respostaId")({
  loader: async ({ params }): Promise<ResultadoResposta | null> =>
    obterResultado({ data: { id: params.respostaId } }),
  head: ({ loaderData }) => {
    const titulo = loaderData?.perfilTitulo
      ? `Seu perfil: ${loaderData.perfilTitulo}`
      : "Resultado do Diagnóstico Financeiro";
    const descricao = loaderData
      ? `Resultado do diagnóstico ${loaderData.diagnosticoTitulo}: ${loaderData.scorePercentual}% de aproveitamento com leitura por dimensão.`
      : "Resultado do diagnóstico financeiro comportamental.";
    return {
      meta: [
        { title: `${titulo} | Cibele Lucena` },
        { name: "description", content: descricao.slice(0, 155) },
        { property: "og:title", content: `${titulo} | Cibele Lucena` },
        { property: "og:description", content: descricao.slice(0, 155) },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ResultadoPage,
});

function ResultadoPage() {
  const resultado: ResultadoResposta | null = Route.useLoaderData();
  const params = Route.useParams();
  const gerar = useServerFn(gerarInsights);

  const insightsQuery = useQuery({
    queryKey: ["insights", params.respostaId],
    queryFn: () => gerar({ data: { respostaId: params.respostaId } }),
    enabled: Boolean(resultado) && !resultado?.insights,
    staleTime: Infinity,
    retry: false,
  });

  if (!resultado) {
    return (
      <main className="theme-painel flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold uppercase">Resultado não encontrado</h1>
          <p className="mt-3 text-sm text-muted-foreground">Confira o link do seu resultado.</p>
        </div>
      </main>
    );
  }

  const insights = resultado.insights ?? insightsQuery.data ?? null;

  return (
    <main className="theme-painel min-h-screen bg-background px-5 py-10 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Cibele Lucena · Resultado</p>
        <h1 className="mt-4 text-3xl font-semibold uppercase leading-tight md:text-4xl">
          {resultado.nome.split(" ")[0]}, aqui está seu diagnóstico
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{resultado.diagnosticoTitulo}</p>

        <section className="mt-8 rounded-lg border border-border bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pontuação geral</p>
              <p className="mt-1 text-5xl font-semibold" style={{ color: resultado.perfilCor ?? undefined }}>
                {resultado.scorePercentual}%
              </p>
            </div>
            {resultado.perfilTitulo && (
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Seu perfil</p>
                <p className="mt-1 text-xl font-semibold uppercase">{resultado.perfilTitulo}</p>
              </div>
            )}
          </div>
          <Progress value={resultado.scorePercentual} className="mt-5 h-2" />
          {resultado.perfilDescricao && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-foreground">
              {resultado.perfilDescricao}
            </p>
          )}
        </section>

        {resultado.distribuicao.length > 1 && (
          <div className="mt-8">
            <PerfilDistribuicao fatias={resultado.distribuicao} />
          </div>
        )}

        {resultado.perfilConteudo && (
          <div className="mt-8">
            <PerfilConteudo conteudo={resultado.perfilConteudo} perfilTitulo={resultado.perfilTitulo} />
          </div>
        )}



        {resultado.linkAgendamento && (
          <div className="mt-6">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={resultado.linkAgendamento} target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                Agendar devolutiva agora
              </a>
            </Button>
          </div>
        )}

        {resultado.rotulos.some((r) => r.rotulo) && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold uppercase">O que suas respostas revelam</h2>
            <div className="mt-4 space-y-3">
              {resultado.rotulos
                .filter((r) => r.rotulo)
                .map((r, i) => (
                  <div key={`${r.pergunta}-${i}`} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{r.pergunta}</p>
                    <p className="mt-2 text-sm font-semibold text-accent">{r.rotulo}</p>
                    {r.descricao && (
                      <p className="mt-1 text-sm leading-relaxed text-foreground">{r.descricao}</p>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {resultado.dimensoes.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold uppercase">Leitura por dimensão</h2>
            <div className="mt-4 space-y-4">
              {resultado.dimensoes
                .slice()
                .sort((a, b) => b.scorePercentual - a.scorePercentual)
                .map((dim, i) => (
                  <div key={dim.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        {dim.titulo}
                        {i === 0 && (
                          <span className="ml-2 rounded-sm bg-accent/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-accent">
                            Predominante
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-foreground">{dim.scorePercentual}%</p>
                    </div>
                    <Progress value={dim.scorePercentual} className="mt-3 h-1.5" />
                  </div>
                ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-semibold uppercase">Sua leitura personalizada</h2>
          {!insights && insightsQuery.isPending && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Gerando sua análise...
            </p>
          )}
          {insights && (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Bloco titulo="Pontos fortes" itens={insights.pontosFortes} icone="ok" />
              <Bloco titulo="Riscos" itens={insights.riscos} icone="risco" />
              <Bloco titulo="Próximos passos" itens={insights.proximosPassos} icone="passo" />
            </div>
          )}
        </section>

        <section className="mt-10 rounded-lg border border-accent bg-accent/10 p-6">
          <h2 className="text-xl font-semibold uppercase">Quer transformar isso em um plano?</h2>
          <p className="mt-2 text-sm text-foreground">
            Na devolutiva, revisamos ponto por ponto o seu diagnóstico e definimos as prioridades dos próximos 90 dias.
          </p>
          {resultado.linkAgendamento && (
            <Button asChild size="lg" className="mt-5 mr-3">
              <a href={resultado.linkAgendamento} target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                Agendar devolutiva agora
              </a>
            </Button>
          )}
        </section>
      </div>
    </main>
  );
}

function Bloco({ titulo, itens, icone }: { titulo: string; itens: string[]; icone: "ok" | "risco" | "passo" }) {
  if (itens.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-accent">{titulo}</p>
      <ul className="mt-3 space-y-3">
        {itens.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed">
            {icone === "risco" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            )}
            <span className="text-card-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
