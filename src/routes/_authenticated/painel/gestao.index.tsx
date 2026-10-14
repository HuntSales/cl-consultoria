import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Settings, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cpfValido, formatarCpf } from "@/lib/cpf";
import {
  criarClienteGestao,
  excluirClienteGestao,
  listarClientesGestao,
  verificarCpfNoCrm,
  type VinculoCpf,
} from "@/lib/gestao.functions";

export const Route = createFileRoute("/_authenticated/painel/gestao/")({
  head: () => ({
    meta: [
      { title: "Gestão de Clientes | Painel Cibele Lucena" },
      { name: "description", content: "Cadastre clientes por CPF e conecte o agente de IA à gestão financeira MyMoney." },
      { property: "og:title", content: "Gestão de Clientes | Painel Cibele Lucena" },
      { property: "og:description", content: "Clientes vinculados por CPF, diagnósticos e insights do agente de IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GestaoClientesPage,
});

function GestaoClientesPage() {
  const queryClient = useQueryClient();
  const listarFn = useServerFn(listarClientesGestao);
  const criarFn = useServerFn(criarClienteGestao);
  const excluirFn = useServerFn(excluirClienteGestao);
  const verificarFn = useServerFn(verificarCpfNoCrm);

  const clientes = useQuery({ queryKey: ["clientes-gestao"], queryFn: () => listarFn({ data: {} as never }) });

  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [vinculo, setVinculo] = useState<VinculoCpf | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function verificar() {
    if (!cpfValido(cpf)) {
      toast.error("Informe um CPF válido.");
      return;
    }
    setVerificando(true);
    try {
      const resultado = await verificarFn({ data: { cpf } });
      setVinculo(resultado);
      if (resultado.encontrado) {
        if (!nome && resultado.nome) setNome(resultado.nome);
        if (!email && resultado.email) setEmail(resultado.email);
        if (!telefone && resultado.whatsapp) setTelefone(resultado.whatsapp);
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível verificar o CPF.");
    } finally {
      setVerificando(false);
    }
  }

  async function cadastrar() {
    if (!cpfValido(cpf) || nome.trim().length < 2) {
      toast.error("Informe CPF válido e nome do cliente.");
      return;
    }
    setSalvando(true);
    try {
      await criarFn({
        data: {
          cpf,
          nome: nome.trim(),
          email: email.trim() || undefined,
          telefone: telefone.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
        },
      });
      setCpf("");
      setNome("");
      setEmail("");
      setTelefone("");
      setObservacoes("");
      setVinculo(null);
      await queryClient.invalidateQueries({ queryKey: ["clientes-gestao"] });
      toast.success("Cliente cadastrado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível cadastrar o cliente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-wide">Gestão de Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre o cliente pelo CPF, vincule o MyMoney e converse com o agente de IA.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/painel/gestao/configuracoes">
            <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
            Configurações
          </Link>
        </Button>
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Novo cliente</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cpf-cliente">CPF *</Label>
            <div className="flex gap-2">
              <Input
                id="cpf-cliente"
                value={cpf}
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                onChange={(e) => {
                  setCpf(formatarCpf(e.target.value));
                  setVinculo(null);
                }}
              />
              <Button variant="outline" disabled={verificando} onClick={() => void verificar()}>
                {verificando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Verificar
              </Button>
            </div>
            {vinculo && (
              <p className="text-xs text-muted-foreground">
                {vinculo.encontrado
                  ? `Encontrado no CRM: ${vinculo.nome} · ${vinculo.totalDiagnosticos} diagnóstico(s).`
                  : "CPF sem diagnósticos no CRM — o cadastro continua permitido."}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome-cliente">Nome *</Label>
            <Input id="nome-cliente" value={nome} maxLength={120} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-cliente">E-mail</Label>
            <Input id="email-cliente" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel-cliente">Telefone</Label>
            <Input id="tel-cliente" value={telefone} maxLength={30} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="obs-cliente">Observações</Label>
            <Textarea
              id="obs-cliente"
              value={observacoes}
              maxLength={2000}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>
        <Button className="mt-4" disabled={salvando} onClick={() => void cadastrar()}>
          {salvando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Cadastrar cliente
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Clientes</h2>
        {clientes.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (clientes.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(clientes.data ?? []).map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatarCpf(c.cpf)}</p>
                    {c.email && <p className="truncate text-xs text-muted-foreground">{c.email}</p>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Excluir ${c.nome}`}
                    onClick={async () => {
                      if (!window.confirm(`Excluir ${c.nome} e todo o histórico do agente?`)) return;
                      try {
                        await excluirFn({ data: { id: c.id } });
                        await queryClient.invalidateQueries({ queryKey: ["clientes-gestao"] });
                        toast.success("Cliente excluído.");
                      } catch {
                        toast.error("Não foi possível excluir.");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button size="sm" asChild>
                    <Link to="/painel/gestao/$clienteId" params={{ clienteId: c.id }}>
                      Abrir agente
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
