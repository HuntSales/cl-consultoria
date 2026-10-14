import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { salvarPontuacao } from "@/lib/diagnosticos.functions";
import type { DimensaoCompleta } from "@/lib/diagnosticos.functions";
import { numerarPerguntas } from "@/lib/scoring";

type Rascunho = Record<string, number>;

const RAMO_LABEL: Record<string, string> = {
  comum: "Comum",
  solteiro: "Individual",
  casal: "Casal",
};

export function PontuacaoTab({ id, dimensoes }: { id: string; dimensoes: DimensaoCompleta[] }) {
  const queryClient = useQueryClient();
  const salvar = useServerFn(salvarPontuacao);
  const [salvando, setSalvando] = useState(false);
  const [pesosDim, setPesosDim] = useState<Rascunho>({});
  const [pesosPerg, setPesosPerg] = useState<Rascunho>({});
  const [pesosOpc, setPesosOpc] = useState<Rascunho>({});

  const numeracao = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of numerarPerguntas(dimensoes)) mapa.set(p.id, p.numero);
    return mapa;
  }, [dimensoes]);

  const alterados =
    Object.keys(pesosDim).length + Object.keys(pesosPerg).length + Object.keys(pesosOpc).length;

  const valorDim = (d: DimensaoCompleta) => pesosDim[d.id] ?? d.pesoDimensao ?? 1;

  async function persistir() {
    setSalvando(true);
    try {
      await salvar({
        data: {
          diagnosticoId: id,
          dimensoes: Object.entries(pesosDim).map(([dimId, pesoDimensao]) => ({ id: dimId, pesoDimensao })),
          perguntas: Object.entries(pesosPerg).map(([pergId, pesoPergunta]) => ({ id: pergId, pesoPergunta })),
          opcoes: Object.entries(pesosOpc).map(([opcId, peso]) => ({ id: opcId, peso })),
        },
      });
      setPesosDim({});
      setPesosPerg({});
      setPesosOpc({});
      await queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
      toast.success("Pontuação atualizada.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar a pontuação.");
    } finally {
      setSalvando(false);
    }
  }

  if (dimensoes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie dimensões e perguntas antes de configurar a pontuação.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Pesos do diagnóstico</p>
          <p className="text-xs text-muted-foreground">
            Score = peso da opção × peso da pergunta × peso da dimensão. O percentual é calculado sobre o máximo
            possível do caminho respondido — é ele que amarra o perfil à pontuação.
          </p>
        </div>
        <Button onClick={persistir} disabled={salvando || alterados === 0}>
          <Save className="mr-2 h-4 w-4" />
          {alterados === 0 ? "Sem alterações" : `Salvar ${alterados} alteração(ões)`}
        </Button>
      </div>

      {dimensoes.map((dim) => {
        const maximoDim = dim.perguntas.reduce((acc, perg) => {
          if (perg.ramifica) return acc;
          const maxOpc = Math.max(...perg.opcoes.map((o) => pesosOpc[o.id] ?? o.peso ?? 0), 0);
          return acc + maxOpc * (pesosPerg[perg.id] ?? perg.pesoPergunta ?? 1);
        }, 0);

        return (
          <Card key={dim.id}>
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">{dim.titulo}</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{RAMO_LABEL[dim.ramo ?? "comum"] ?? "Comum"}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Peso da dimensão</span>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      max={10}
                      className="h-8 w-20"
                      value={valorDim(dim)}
                      onChange={(e) =>
                        setPesosDim((prev) => ({ ...prev, [dim.id]: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo desta dimensão: {Math.round(maximoDim * valorDim(dim) * 100) / 100} pontos
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {dim.perguntas.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma pergunta nesta dimensão.</p>
              )}
              {dim.perguntas.map((perg) => (
                <div key={perg.id} className="rounded-md border border-border/60 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-xl text-sm">
                      {numeracao.has(perg.id) && (
                        <span className="mr-2 text-xs font-semibold text-accent">P{numeracao.get(perg.id)}</span>
                      )}
                      {perg.texto}
                      {perg.ramifica && (
                        <Badge variant="outline" className="ml-2 align-middle text-[10px]">
                          Ramificação · não pontua
                        </Badge>
                      )}
                    </div>

                    {!perg.ramifica && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Peso da pergunta</span>
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={10}
                          className="h-8 w-20"
                          value={pesosPerg[perg.id] ?? perg.pesoPergunta ?? 1}
                          onChange={(e) =>
                            setPesosPerg((prev) => ({ ...prev, [perg.id]: Number(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  {!perg.ramifica && (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {perg.opcoes.map((opc) => (
                        <div key={opc.id} className="flex items-center gap-2 rounded border border-border/50 px-2 py-1.5">
                          {opc.letra && (
                            <span className="text-xs font-semibold text-accent">{opc.letra.toUpperCase()}</span>
                          )}
                          <span className="flex-1 truncate text-xs text-muted-foreground">{opc.texto}</span>
                          <Input
                            type="number"
                            step="1"
                            min={0}
                            max={1000}
                            className="h-8 w-20"
                            value={pesosOpc[opc.id] ?? opc.peso ?? 0}
                            onChange={(e) =>
                              setPesosOpc((prev) => ({ ...prev, [opc.id]: Number(e.target.value) || 0 }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
