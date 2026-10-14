import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, Eye, FileText, Loader2, RefreshCw, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Devolutiva } from "@/lib/devolutiva.functions";
import { gerarDevolutiva } from "@/lib/devolutiva.functions";
import type { RespostaDetalhe } from "@/lib/respostas-admin.functions";
import { excluirResposta, listarRespostas, obterRespostaDetalhe } from "@/lib/respostas-admin.functions";

const respostasQueryOptions = queryOptions({
  queryKey: ["respostas"],
  queryFn: () => listarRespostas(),
});

export const Route = createFileRoute("/_authenticated/painel/respostas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(respostasQueryOptions),
  head: () => ({
    meta: [
      { title: "Respostas do diagnóstico | Painel Cibele Lucena" },
      { name: "description", content: "Acompanhe as respostas recebidas nos diagnósticos financeiros publicados." },
    ],
  }),
  component: RespostasPage,
});

function RespostasPage() {
  const { data } = useSuspenseQuery(respostasQueryOptions);
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const detalheFn = useServerFn(obterRespostaDetalhe);
  const excluirFn = useServerFn(excluirResposta);

  const detalhe = useQuery({
    queryKey: ["resposta", detalheId],
    queryFn: () => detalheFn({ data: { id: detalheId! } }),
    enabled: Boolean(detalheId),
  });

  const filtradas = data.filter((r) => {
    const termo = busca.toLowerCase();
    return (
      r.nome.toLowerCase().includes(termo) ||
      r.email.toLowerCase().includes(termo) ||
      r.diagnosticoTitulo.toLowerCase().includes(termo) ||
      (r.perfilTitulo ?? "").toLowerCase().includes(termo)
    );
  });

  async function remover(id: string) {
    try {
      await excluirFn({ data: { id } });
      toast.success("Resposta removida.");
      await queryClient.invalidateQueries({ queryKey: ["respostas"] });
    } catch {
      toast.error("Não foi possível remover a resposta.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold uppercase">Respostas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.length} resposta{data.length === 1 ? "" : "s"} recebida{data.length === 1 ? "" : "s"} nos diagnósticos publicados.
        </p>
      </header>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail, diagnóstico ou perfil"
          className="pl-9"
        />
      </div>

      {filtradas.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma resposta encontrada.</Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {r.diagnosticoTitulo}
                  {r.ramo && r.ramo !== "comum" ? ` · ${r.ramo === "casal" ? "Casal" : "Individual"}` : ""}
                </p>

              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-semibold">{r.scorePercentual}%</p>
                  {r.perfilTitulo && (
                    <Badge variant="outline" className="border-accent text-[10px] uppercase">
                      {r.perfilTitulo}
                    </Badge>
                  )}
                </div>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {new Date(r.criadoEm).toLocaleDateString("pt-BR")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden gap-1.5 border-accent text-xs sm:inline-flex"
                  onClick={() => setDetalheId(r.id)}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Devolutiva
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDetalheId(r.id)} aria-label="Ver detalhes">
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remover(r.id)} aria-label="Remover resposta">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(detalheId)} onOpenChange={(aberto) => !aberto && setDetalheId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detalhe.data?.nome ?? "Detalhe da resposta"}</DialogTitle>
            <DialogDescription>
              {detalhe.data ? `${detalhe.data.email} · ${detalhe.data.diagnosticoTitulo}` : "Carregando..."}
            </DialogDescription>
          </DialogHeader>

          {detalhe.data && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Pontuação: {detalhe.data.scorePercentual}%
                    {detalhe.data.perfilTitulo ? ` · ${detalhe.data.perfilTitulo}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detalhe.data.score} de {detalhe.data.scoreMaximo} pontos
                  </p>
                </div>
                <Progress value={detalhe.data.scorePercentual} className="mt-2 h-2" />
              </div>

              {detalhe.data.dimensoes.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Por dimensão</p>
                  <div className="mt-3 space-y-2">
                    {detalhe.data.dimensoes.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <span>{d.titulo}</span>
                        <span className="text-muted-foreground">{d.scorePercentual}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DevolutivaPainel resposta={detalhe.data} />

              {detalhe.data.insights && (
                <div className="space-y-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Insights de IA</p>
                  {[
                    ["Pontos fortes", detalhe.data.insights.pontosFortes] as const,
                    ["Riscos", detalhe.data.insights.riscos] as const,
                    ["Próximos passos", detalhe.data.insights.proximosPassos] as const,
                  ].map(([titulo, itens]) => (
                    <div key={titulo}>
                      <p className="text-sm font-medium">{titulo}</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#051d40]">
                        {itens.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Respostas</p>
                <div className="mt-3 space-y-3">
                  {detalhe.data.itens.map((i, idx) => (
                    <div key={idx} className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">{i.dimensaoTitulo}</p>
                      <p className="mt-1 text-sm">{i.perguntaTexto}</p>
                      <p className="mt-1 text-sm font-medium">
                        {i.opcaoTexto} <span className="text-xs text-muted-foreground">({i.pesoAplicado} pts)</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function mensagemErro(erro: unknown, padrao: string) {
  const texto = erro instanceof Error ? erro.message : String(erro ?? "");
  if (/unauthorized|401|jwt|session/i.test(texto)) {
    return "Sua sessão expirou. Entre novamente para gerar a devolutiva.";
  }
  if (/forbidden|403|permission/i.test(texto)) {
    return "Você não tem permissão para gerar a devolutiva desta resposta.";
  }
  return texto.trim() ? `${padrao} (${texto.trim().slice(0, 160)})` : padrao;
}

function DevolutivaPainel({ resposta }: { resposta: RespostaDetalhe }) {
  const gerar = useServerFn(gerarDevolutiva);
  const [devolutiva, setDevolutiva] = useState<Devolutiva | null>(resposta.devolutiva);
  const [etapa, setEtapa] = useState<"idle" | "gerando" | "pdf">("idle");
  const carregando = etapa === "gerando";
  const baixando = etapa === "pdf";

  async function baixarPdf(alvo?: Devolutiva | null) {
    const dados = alvo ?? devolutiva;
    if (!dados) {
      setEtapa("idle");
      return;
    }
    setEtapa("pdf");
    try {
      const { gerarPdfDevolutiva } = await import("@/lib/devolutiva-pdf");
      gerarPdfDevolutiva(resposta, dados);
      toast.success("PDF gerado.");
    } catch (erro) {
      toast.error(mensagemErro(erro, "Falha ao gerar o PDF."));
    } finally {
      setEtapa("idle");
    }
  }

  async function executar(forcar: boolean) {
    setEtapa("gerando");
    try {
      const resultado = await gerar({ data: { respostaId: resposta.id, forcar } });
      setDevolutiva(resultado);
      toast.success("Devolutiva gerada. Baixando o PDF...");
      await baixarPdf(resultado);
    } catch (erro) {
      toast.error(mensagemErro(erro, "Não foi possível gerar a devolutiva."));
      setEtapa("idle");
    }
  }


  return (
    <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Devolutiva do consultor</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Foco da conversa, pontos a abordar e plano de 90 dias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => executar(Boolean(devolutiva))}
            disabled={carregando || baixando}
            className={cn(
              "gap-1.5 border-transparent bg-[#d0b266] text-[#051d40] shadow-sm transition-colors hover:bg-[#b8994f]",
              devolutiva && !carregando && !baixando && "ring-1 ring-[#051d40]/20",
            )}
          >
            {carregando || baixando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : devolutiva ? (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {carregando
              ? "Gerando insights..."
              : baixando
                ? "Montando PDF..."
                : devolutiva
                  ? "Gerar novamente"
                  : "Gerar insights e PDF"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => baixarPdf()}
            disabled={!devolutiva || carregando || baixando}
            className="gap-1.5 border-[#d0b266] text-[#051d40] hover:bg-[#d0b266]/10 hover:text-[#051d40] disabled:opacity-50"
          >
            {baixando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Baixar PDF
          </Button>
        </div>
      </div>

      {!devolutiva && !carregando && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Nenhuma devolutiva gerada ainda.
        </p>
      )}

      {devolutiva && (
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="font-medium">Foco principal</p>
            <p className="mt-1 text-muted-foreground">{devolutiva.focoPrincipal}</p>
          </div>
          {([
            ["Pontos a abordar", devolutiva.pontosAbordar],
            ["Perguntas de aprofundamento", devolutiva.perguntasAprofundamento],
            ["Cuidados de abordagem", devolutiva.alertas],
          ] as const).map(([titulo, itens]) =>
            itens.length > 0 ? (
              <div key={titulo}>
                <p className="font-medium">{titulo}</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {itens.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {devolutiva.planoAcao.length > 0 && (
            <div>
              <p className="font-medium">Plano de ação (90 dias)</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {devolutiva.planoAcao.map((a, idx) => (
                  <li key={`${a.prazo}-${idx}`}>
                    <span className="font-medium text-foreground">{a.prazo}:</span> {a.acao}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

