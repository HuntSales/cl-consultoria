import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  atualizarMotivoPerda,
  criarMotivoPerda,
  excluirMotivoPerda,
  listarMotivosPerda,
} from "@/lib/crm.functions";

export function GerenciarMotivosDialog({
  aberto,
  onOpenChange,
  podeEditar,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  podeEditar: boolean;
}) {
  const queryClient = useQueryClient();
  const criar = useServerFn(criarMotivoPerda);
  const atualizar = useServerFn(atualizarMotivoPerda);
  const excluir = useServerFn(excluirMotivoPerda);

  const motivos = useQuery({ queryKey: ["motivos-perda"], queryFn: () => listarMotivosPerda() });
  const lista = motivos.data ?? [];
  const [novo, setNovo] = useState("");

  const salvar = useMutation({
    mutationFn: async (acao: () => Promise<unknown>) => acao(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["motivos-perda"] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
      ]);
    },
    onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar."),
  });

  function mover(indice: number, direcao: -1 | 1) {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= lista.length) return;
    const a = lista[indice];
    const b = lista[alvo];
    salvar.mutate(async () => {
      await atualizar({ data: { id: a.id, ordem: alvo } });
      await atualizar({ data: { id: b.id, ordem: indice } });
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="theme-painel max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Motivos de perda</DialogTitle>
          <DialogDescription>
            {podeEditar
              ? "Lista usada pelos consultores ao marcar um lead como perdido."
              : "Somente a administradora master pode alterar os motivos."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {lista.map((motivo, indice) => (
            <div key={motivo.id} className="flex items-center gap-2 rounded border border-border p-2">
              <Input
                defaultValue={motivo.titulo}
                disabled={!podeEditar}
                onBlur={(e) => {
                  const titulo = e.target.value.trim();
                  if (!titulo || titulo === motivo.titulo) return;
                  salvar.mutate(() => atualizar({ data: { id: motivo.id, titulo } }));
                }}
                className={`h-8 ${motivo.ativo ? "" : "opacity-50 line-through"}`}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 text-xs"
                disabled={!podeEditar}
                onClick={() => salvar.mutate(() => atualizar({ data: { id: motivo.id, ativo: !motivo.ativo } }))}
              >
                {motivo.ativo ? "Desativar" : "Ativar"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!podeEditar || indice === 0}
                onClick={() => mover(indice, -1)}
                aria-label="Subir motivo"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!podeEditar || indice === lista.length - 1}
                onClick={() => mover(indice, 1)}
                aria-label="Descer motivo"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                disabled={!podeEditar}
                onClick={() =>
                  salvar.mutate(async () => {
                    const r = (await excluir({ data: { id: motivo.id } })) as { desativado?: boolean };
                    toast.success(
                      r?.desativado
                        ? "Motivo já usado em leads: foi desativado e não aparece mais na lista."
                        : "Motivo removido.",
                    );
                  })
                }
                aria-label={`Remover motivo ${motivo.titulo}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {podeEditar && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo motivo de perda" />
            <Button
              disabled={!novo.trim()}
              onClick={() =>
                salvar.mutate(async () => {
                  await criar({ data: { titulo: novo.trim() } });
                  setNovo("");
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
