import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { listarDiagnosticos, excluirDiagnostico } from "@/lib/diagnosticos.functions";

const diagnosticosQueryOptions = queryOptions({
  queryKey: ["diagnosticos"],
  queryFn: () => listarDiagnosticos(),
});

export const Route = createFileRoute("/_authenticated/painel/diagnosticos/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(diagnosticosQueryOptions),
  component: DiagnosticosPage,
});

function DiagnosticosPage() {
  const { data } = useSuspenseQuery(diagnosticosQueryOptions);
  const [busca, setBusca] = useState("");
  const [excluir, setExcluir] = useState<string | null>(null);
  const excluirFn = useServerFn(excluirDiagnostico);

  const filtrados = data.filter((d) => {
    const termo = busca.toLowerCase();
    return d.titulo.toLowerCase().includes(termo) || (d.slug || "").toLowerCase().includes(termo);
  });

  async function confirmarExclusao() {
    if (!excluir) return;
    try {
      await excluirFn({ data: { id: excluir } });
      toast.success("Diagnóstico excluído.");
    } catch (e) {
      toast.error("Não foi possível excluir o diagnóstico.");
    } finally {
      setExcluir(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-wide">Diagnósticos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie, edite e publique os questionários financeiros comportamentais.
          </p>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/painel/diagnosticos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo diagnóstico
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou slug..."
          className="pl-9"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">
            {busca ? "Nenhum diagnóstico encontrado." : "Nenhum diagnóstico criado ainda."}
          </p>
          {!busca && (
            <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/painel/diagnosticos/novo">Criar o primeiro diagnóstico</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtrados.map((d) => (
            <Card key={d.id} className="flex items-center justify-between p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="truncate text-lg font-medium">{d.titulo}</h3>
                  <Badge variant={d.status === "publicado" ? "default" : "secondary"}>
                    {d.status === "publicado" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  /{d.slug} · {d.totalDimensoes} {d.totalDimensoes === 1 ? "dimensão" : "dimensões"} ·{" "}
                  {d.totalPerguntas} {d.totalPerguntas === 1 ? "pergunta" : "perguntas"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/painel/diagnosticos/$id" params={{ id: d.id }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setExcluir(d.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!excluir} onOpenChange={() => setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir diagnóstico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as dimensões, perguntas, opções e perfis de resultado serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
