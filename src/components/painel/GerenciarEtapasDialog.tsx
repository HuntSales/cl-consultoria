import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  atualizarEtapa,
  criarEtapa,
  excluirEtapa,
  listarEtapas,
  reordenarEtapas,
  type EtapaFunil,
} from "@/lib/crm.functions";

export function GerenciarEtapasDialog({
  aberto,
  onOpenChange,
  podeEditar,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  podeEditar: boolean;
}) {
  const queryClient = useQueryClient();
  const criar = useServerFn(criarEtapa);
  const atualizar = useServerFn(atualizarEtapa);
  const reordenar = useServerFn(reordenarEtapas);
  const excluir = useServerFn(excluirEtapa);

  const etapas = useQuery({ queryKey: ["crm-etapas"], queryFn: () => listarEtapas() });
  const lista = etapas.data ?? [];

  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCor, setNovaCor] = useState("#051d40");
  const [paraExcluir, setParaExcluir] = useState<EtapaFunil | null>(null);
  const [destino, setDestino] = useState<string>("");

  async function recarregar() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["crm-etapas"] }),
      queryClient.invalidateQueries({ queryKey: ["leads"] }),
    ]);
  }

  const salvar = useMutation({
    mutationFn: async (acao: () => Promise<unknown>) => acao(),
    onSuccess: async () => {
      await recarregar();
    },
    onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar."),
  });

  function mover(indice: number, direcao: -1 | 1) {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= lista.length) return;
    const ids = lista.map((e) => e.id);
    [ids[indice], ids[alvo]] = [ids[alvo], ids[indice]];
    salvar.mutate(() => reordenar({ data: { ids } }));
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="theme-painel max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Etapas do funil</DialogTitle>
          <DialogDescription>
            {podeEditar
              ? "Crie, renomeie, reordene ou exclua as colunas do quadro."
              : "Somente a administradora master pode alterar as etapas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {lista.map((etapa, indice) => (
            <div key={etapa.id} className="flex items-center gap-2 rounded border border-border p-2">
              <input
                type="color"
                value={etapa.cor}
                disabled={!podeEditar}
                onChange={(e) => salvar.mutate(() => atualizar({ data: { id: etapa.id, cor: e.target.value } }))}
                className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent"
                aria-label={`Cor da etapa ${etapa.titulo}`}
              />
              <Input
                defaultValue={etapa.titulo}
                disabled={!podeEditar}
                onBlur={(e) => {
                  const titulo = e.target.value.trim();
                  if (!titulo || titulo === etapa.titulo) return;
                  salvar.mutate(() => atualizar({ data: { id: etapa.id, titulo } }));
                }}
                className="h-8"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!podeEditar || indice === 0}
                onClick={() => mover(indice, -1)}
                aria-label="Subir etapa"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={!podeEditar || indice === lista.length - 1}
                onClick={() => mover(indice, 1)}
                aria-label="Descer etapa"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                disabled={!podeEditar || lista.length <= 1}
                onClick={() => {
                  setParaExcluir(etapa);
                  setDestino(lista.find((e) => e.id !== etapa.id)?.id ?? "");
                }}
                aria-label={`Excluir etapa ${etapa.titulo}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {podeEditar && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <input
              type="color"
              value={novaCor}
              onChange={(e) => setNovaCor(e.target.value)}
              className="h-9 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent"
              aria-label="Cor da nova etapa"
            />
            <Input
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              placeholder="Nome da nova etapa"
            />
            <Button
              disabled={!novoTitulo.trim()}
              onClick={() =>
                salvar.mutate(async () => {
                  await criar({ data: { titulo: novoTitulo.trim(), cor: novaCor } });
                  setNovoTitulo("");
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        )}

        {paraExcluir && (
          <div className="space-y-3 rounded border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm">
              Excluir a etapa <strong>{paraExcluir.titulo}</strong>. Para onde vão os leads dessa etapa?
            </p>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa de destino" />
              </SelectTrigger>
              <SelectContent>
                {lista
                  .filter((e) => e.id !== paraExcluir.id)
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.titulo}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setParaExcluir(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!destino}
                onClick={() =>
                  salvar.mutate(async () => {
                    await excluir({ data: { id: paraExcluir.id, destinoId: destino } });
                    setParaExcluir(null);
                    toast.success("Etapa excluída.");
                  })
                }
              >
                Excluir etapa
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
