import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  alterarPapelUsuario,
  alterarStatusUsuario,
  listarUsuarios,
  type Papel,
  type Situacao,
  type UsuarioPainel,
} from "@/lib/acesso.functions";

export const Route = createFileRoute("/_authenticated/painel/usuarios")({
  component: UsuariosPage,
});

const rotuloStatus: Record<Situacao, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  bloqueado: "Bloqueado",
};

type AcaoPendente = {
  usuario: UsuarioPainel;
  status: Situacao;
  titulo: string;
  descricao: string;
};

function UsuariosPage() {
  const acesso = Route.useRouteContext();
  const queryClient = useQueryClient();
  const buscarUsuarios = useServerFn(listarUsuarios);
  const mudarStatus = useServerFn(alterarStatusUsuario);
  const mudarPapel = useServerFn(alterarPapelUsuario);
  const [acao, setAcao] = useState<AcaoPendente | null>(null);

  const meuId = acesso.user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["usuarios-painel"],
    queryFn: () => buscarUsuarios(),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { usuarioId: string; status: Situacao }) => mudarStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios-painel"] });
      toast.success("Situação atualizada.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const papelMutation = useMutation({
    mutationFn: (vars: { usuarioId: string; papel: Papel }) => mudarPapel({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios-painel"] });
      toast.success("Papel atualizado.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Equipe</p>
        <h1 className="mt-2 text-2xl font-semibold uppercase">Usuários</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aprove, bloqueie e defina o papel de quem acessa o painel.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((u) => {
                  const souEu = u.id === meuId;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.nomeCompleto || "—"}
                        {souEu ? (
                          <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.papel}
                          disabled={souEu || papelMutation.isPending}
                          onValueChange={(valor) =>
                            papelMutation.mutate({ usuarioId: u.id, papel: valor as Papel })
                          }
                        >
                          <SelectTrigger className="w-[170px]" aria-label={`Papel de ${u.email}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consultor">Consultora</SelectItem>
                            <SelectItem value="master_admin">Administradora</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            u.status === "aprovado"
                              ? "border-success text-success"
                              : u.status === "bloqueado"
                                ? "border-destructive text-destructive"
                                : "border-accent text-accent-foreground"
                          }
                        >
                          {rotuloStatus[u.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        {u.status !== "aprovado" ? (
                          <Button
                            size="sm"
                            disabled={souEu || statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ usuarioId: u.id, status: "aprovado" })
                            }
                          >
                            {u.status === "bloqueado" ? "Reativar" : "Aprovar"}
                          </Button>
                        ) : null}
                        {u.status !== "bloqueado" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={souEu || statusMutation.isPending}
                            onClick={() =>
                              setAcao({
                                usuario: u,
                                status: "bloqueado",
                                titulo: `Bloquear ${u.nomeCompleto || u.email}?`,
                                descricao: `${u.nomeCompleto || u.email} perde o acesso ao painel imediatamente. Você pode reativar depois.`,
                              })
                            }
                          >
                            Bloquear
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={acao !== null} onOpenChange={(aberto) => !aberto && setAcao(null)}>
        <AlertDialogContent className="theme-painel">
          <AlertDialogHeader>
            <AlertDialogTitle>{acao?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>{acao?.descricao}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (acao) {
                  statusMutation.mutate({ usuarioId: acao.usuario.id, status: acao.status });
                }
                setAcao(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
