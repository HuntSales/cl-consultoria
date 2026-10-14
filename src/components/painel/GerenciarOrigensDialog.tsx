import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { atualizarOrigem, criarOrigem, excluirOrigem, listarOrigens } from "@/lib/crm.functions";

export function GerenciarOrigensDialog({
  aberto,
  onOpenChange,
  podeEditar,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  podeEditar: boolean;
}) {
  const queryClient = useQueryClient();
  const criar = useServerFn(criarOrigem);
  const atualizar = useServerFn(atualizarOrigem);
  const excluir = useServerFn(excluirOrigem);

  const origens = useQuery({ queryKey: ["origens"], queryFn: () => listarOrigens() });
  const lista = origens.data ?? [];
  const [nova, setNova] = useState("");

  const salvar = useMutation({
    mutationFn: async (acao: () => Promise<unknown>) => acao(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["origens"] }),
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
          <DialogTitle>Origens</DialogTitle>
          <DialogDescription>
            {podeEditar
              ? "Lista de origens disponível em todos os cards do CRM. Novos leads entram sem origem."
              : "Somente a administradora master pode alterar as origens."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {lista.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma origem cadastrada ainda.</p>
          )}
          {lista.map((origem, indice) => (
            <div key={origem.id} className="flex items-center gap-2 rounded border border-border p-2">
              <Input
                defaultValue={origem.titulo}
                disabled={!podeEditar}
                onBlur={(e) => {
                  const titulo = e.target.value.trim();
                  if (!titulo || titulo === origem.titulo) return;
                  salvar.mutate(() => atualizar({ data: { id: origem.id, titulo } }));
                }}
                className={`h-8 ${origem.ativo ? "" : "opacity-50 line-through"}`}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 shrink-0 text-xs"
                disabled={!podeEditar}
                onClick={() => salvar.mutate(() => atualizar({ data: { id: origem.id, ativo: !origem.ativo } }))}
              >
                {origem.ativo ? "Desativar" : "Ativar"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!podeEditar || indice === 0}
                onClick={() => mover(indice, -1)}
                aria-label="Subir origem"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!podeEditar || indice === lista.length - 1}
                onClick={() => mover(indice, 1)}
                aria-label="Descer origem"
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
                    const r = (await excluir({ data: { id: origem.id } })) as { desativado?: boolean };
                    toast.success(
                      r?.desativado
                        ? "Origem já usada em leads: foi desativada e não aparece mais na lista."
                        : "Origem removida.",
                    );
                  })
                }
                aria-label={`Remover origem ${origem.titulo}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {podeEditar && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Input
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              placeholder="Nova origem (ex.: Indicação)"
            />
            <Button
              disabled={!nova.trim()}
              onClick={() =>
                salvar.mutate(async () => {
                  await criar({ data: { titulo: nova.trim() } });
                  setNova("");
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
