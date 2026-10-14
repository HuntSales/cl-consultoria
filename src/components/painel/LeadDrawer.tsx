import { useEffect, useRef, useState } from "react";
import { PerfilConteudo } from "@/components/diagnostico/PerfilConteudo";
import { PerfilDistribuicao } from "@/components/diagnostico/PerfilDistribuicao";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Trash2,
  X,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  atualizarLead,
  criarAnotacao,
  excluirAnotacao,
  excluirLead,
  gerarUrlAnexo,
  listarEtapas,
  listarMotivosPerda,
  listarOrigens,
  listarResponsaveis,
  marcarResultado,
  obterLead,
  atualizarCpfLead,
  listarDiagnosticosPorCpf,
} from "@/lib/crm.functions";
import { apenasDigitosCpf, cpfValido, formatarCpf } from "@/lib/cpf";
import { reenviarDevolutivaEmail } from "@/lib/respostas-admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { useDitado } from "@/hooks/useDitado";

export function LeadDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const obterFn = useServerFn(obterLead);
  const atualizarFn = useServerFn(atualizarLead);
  const anotarFn = useServerFn(criarAnotacao);
  const excluirAnotacaoFn = useServerFn(excluirAnotacao);
  const excluirLeadFn = useServerFn(excluirLead);
  const reenviarFn = useServerFn(reenviarDevolutivaEmail);
  const [reenviando, setReenviando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const responsaveis = useQuery({ queryKey: ["responsaveis"], queryFn: () => listarResponsaveis() });
  const etapas = useQuery({ queryKey: ["crm-etapas"], queryFn: () => listarEtapas() });
  const motivos = useQuery({ queryKey: ["motivos-perda"], queryFn: () => listarMotivosPerda() });
  const origens = useQuery({ queryKey: ["origens"], queryFn: () => listarOrigens() });
  const origensAtivas = (origens.data ?? []).filter((o) => o.ativo);
  const marcarFn = useServerFn(marcarResultado);
  const salvarCpfFn = useServerFn(atualizarCpfLead);
  const listaEtapas = etapas.data ?? [];
  const motivosAtivos = (motivos.data ?? []).filter((m) => m.ativo);
  const tituloEtapa = (valor: string | null) =>
    listaEtapas.find((e) => e.id === valor)?.titulo ?? valor ?? "—";

  const lead = useQuery({
    queryKey: ["lead", id],
    queryFn: () => obterFn({ data: { id: id! } }),
    enabled: Boolean(id),
  });

  const cpfDoLead = lead.data?.cpf ? apenasDigitosCpf(lead.data.cpf) : "";
  const diagnosticosCpfFn = useServerFn(listarDiagnosticosPorCpf);
  const diagnosticosCpf = useQuery({
    queryKey: ["lead-diagnosticos-cpf", cpfDoLead],
    queryFn: () => diagnosticosCpfFn({ data: { cpf: cpfDoLead } }),
    enabled: cpfDoLead.length === 11,
  });

  const [texto, setTexto] = useState("");
  const [proximoContato, setProximoContato] = useState("");
  const [valor, setValor] = useState("");
  const [cpf, setCpf] = useState("");
  const [salvandoCpf, setSalvandoCpf] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [ditado, setDitado] = useState(false);
  const [salvandoNota, setSalvandoNota] = useState(false);
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);
  const urlAnexoFn = useServerFn(gerarUrlAnexo);
  const { gravando, transcrevendo, alternarGravacao } = useDitado((transcrito) => {
    setDitado(true);
    setTexto((atual) => (atual ? `${atual} ${transcrito}` : transcrito));
  });

  useEffect(() => {
    if (!lead.data) return;
    setProximoContato(lead.data.proximoContato ?? "");
    setValor(lead.data.valorEstimado === null ? "" : String(lead.data.valorEstimado));
    setCpf(lead.data.cpf ? formatarCpf(lead.data.cpf) : "");
  }, [lead.data]);

  async function salvar(patch: Record<string, unknown>) {
    if (!id) return;
    try {
      await atualizarFn({ data: { id, ...patch } as never });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead", id] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
      ]);
      toast.success("Lead atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o lead.");
    }
  }

  async function definirResultado(resultado: "aberto" | "ganho" | "perdido", motivoPerdaId: string | null) {
    if (!id) return;
    try {
      await marcarFn({ data: { id, resultado, motivoPerdaId } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead", id] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
      toast.success("Desfecho atualizado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível registrar o desfecho.");
    }
  }

  async function salvarCpf() {
    if (!id) return;
    if (!cpfValido(cpf)) {
      toast.error("CPF inválido.");
      return;
    }
    setSalvandoCpf(true);
    try {
      await salvarCpfFn({ data: { id, cpf } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead", id] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["lead-diagnosticos-cpf"] }),
      ]);
      toast.success("CPF salvo.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar o CPF.");
    } finally {
      setSalvandoCpf(false);
    }
  }

  async function adicionarAnotacao() {
    if (!id || salvandoNota) return;
    if (!texto.trim() && arquivos.length === 0) return;
    setSalvandoNota(true);
    try {
      const enviados: { path: string; nome: string; mime: string | null; tamanho: number }[] = [];
      for (const arquivo of arquivos) {
        if (arquivo.size > 20 * 1024 * 1024) {
          throw new Error(`"${arquivo.name}" excede 20 MB.`);
        }
        const path = `${id}/${crypto.randomUUID()}-${arquivo.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error } = await supabase.storage.from("lead-anexos").upload(path, arquivo, {
          contentType: arquivo.type || "application/octet-stream",
          upsert: false,
        });
        if (error) throw new Error(`Falha ao enviar "${arquivo.name}".`);
        enviados.push({ path, nome: arquivo.name, mime: arquivo.type || null, tamanho: arquivo.size });
      }

      await anotarFn({
        data: { respostaId: id, texto: texto.trim(), origem: ditado ? "ditado" : "manual", anexos: enviados },
      });
      setTexto("");
      setArquivos([]);
      setDitado(false);
      await queryClient.invalidateQueries({ queryKey: ["lead", id] });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar a anotação.");
    } finally {
      setSalvandoNota(false);
    }
  }

  async function abrirAnexo(anexoId: string) {
    try {
      const { url } = await urlAnexoFn({ data: { id: anexoId } });
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("Não foi possível abrir o anexo.");
    }
  }


  async function removerLead() {
    if (!id) return;
    try {
      await excluirLeadFn({ data: { id } });
      setConfirmarExclusao(false);
      onClose();
      toast.success("Lead excluído.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível excluir o lead.");
    }
  }


  const d = lead.data;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(aberto) => !aberto && onClose()}>
      <SheetContent className="theme-painel w-full overflow-y-auto sm:max-w-xl">
        {!d ? (
          <p className="py-10 text-sm text-muted-foreground">Carregando lead…</p>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="uppercase">{d.nome}</SheetTitle>
              <SheetDescription>
                {d.diagnosticoTitulo} · {new Date(d.criadoEm).toLocaleDateString("pt-BR")}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato</p>
                <p className="text-sm font-medium text-foreground">{d.email}</p>
                {d.whatsapp && <p className="text-sm font-medium text-foreground">{d.whatsapp}</p>}
                {(d.cargo || d.renda) && (
                  <p className="text-sm font-medium text-foreground">
                    {[d.cargo, d.renda].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="flex items-end gap-2 pt-1">
                  <div className="w-48 space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">CPF</p>
                    <Input
                      value={cpf}
                      onChange={(e) => setCpf(formatarCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      inputMode="numeric"
                    />
                  </div>
                  <Button size="sm" variant="outline" disabled={salvandoCpf} onClick={() => void salvarCpf()}>
                    Salvar CPF
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O CPF é obrigatório para marcar o lead como Ganho e para vincular o cliente na Gestão de Clientes.
                </p>

                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Diagnósticos desta pessoa
                  </p>
                  {cpfDoLead.length !== 11 ? (
                    <p className="text-xs text-muted-foreground">
                      Informe o CPF para vincular outros diagnósticos desta pessoa.
                    </p>
                  ) : diagnosticosCpf.isLoading ? (
                    <p className="text-xs text-muted-foreground">Carregando diagnósticos…</p>
                  ) : (diagnosticosCpf.data ?? []).length <= 1 ? (
                    <p className="text-xs text-muted-foreground">Nenhum outro diagnóstico vinculado a este CPF.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(diagnosticosCpf.data ?? []).map((item) => (
                        <li key={item.id}>
                          <a
                            href={`/d/x/r/${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-accent"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {item.diagnosticoTitulo}
                                {item.id === d.id && (
                                  <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
                                    atual
                                  </Badge>
                                )}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                                {item.perfilTitulo ? ` · ${item.perfilTitulo}` : ""} ·{" "}
                                {Math.round(item.scorePercentual)}%
                              </span>
                            </span>
                            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {d.whatsapp && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://wa.me/55${d.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${d.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      E-mail
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard.writeText(`${d.nome} · ${d.email} · ${d.whatsapp ?? ""}`);
                      toast.success("Dados copiados.");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/d/x/r/${d.id}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Resultado
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={reenviando}
                    onClick={async () => {
                      setReenviando(true);
                      try {
                        const r = await reenviarFn({ data: { id: d.id } });
                        if (r.ok) toast.success("Devolutiva reenviada por e-mail.");
                        else toast.error(r.motivo ?? "Não foi possível reenviar.");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Falha ao reenviar.");
                      } finally {
                        setReenviando(false);
                      }
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {reenviando ? "Enviando..." : "Reenviar devolutiva"}
                  </Button>

                </div>
              </section>

              <Separator />

              <section className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Etapa
                  </label>
                  <Select
                    value={d.etapaId ?? listaEtapas[0]?.id ?? ""}
                    onValueChange={(v) => void salvar({ etapaId: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {listaEtapas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Responsável
                  </label>
                  <Select
                    value={d.responsavelId ?? "sem"}
                    onValueChange={(v) => void salvar({ responsavelId: v === "sem" ? null : v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem">Sem responsável</SelectItem>
                      {(responsaveis.data ?? []).map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Origem
                  </label>
                  <Select
                    value={d.origemId ?? "sem"}
                    onValueChange={(v) => void salvar({ origemId: v === "sem" ? null : v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sem origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem">Sem origem</SelectItem>
                      {origensAtivas.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Próximo contato
                  </label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={proximoContato}
                    onChange={(e) => setProximoContato(e.target.value)}
                    onBlur={() => void salvar({ proximoContato: proximoContato || null })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Valor estimado (R$)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    className="mt-1"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    onBlur={() => void salvar({ valorEstimado: valor === "" ? null : Number(valor) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Desfecho
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className={`gap-1 bg-[#05AA7B] font-semibold text-white shadow-none hover:bg-[#048b64] ${
                        d.resultado === "ganho"
                          ? "ring-2 ring-[#05AA7B]/40 ring-offset-1"
                          : "opacity-85"
                      }`}
                      onClick={() => void definirResultado("ganho", null)}
                    >
                      Ganho
                    </Button>
                    <Button
                      size="sm"
                      className={`gap-1 bg-[#c0392b] font-semibold text-white shadow-none hover:bg-[#a52f23] ${
                        d.resultado === "perdido"
                          ? "ring-2 ring-[#c0392b]/40 ring-offset-1"
                          : "opacity-85"
                      }`}
                      onClick={() => {
                        const escolhido = d.motivoPerdaId ?? motivosAtivos[0]?.id ?? null;
                        if (!escolhido) {
                          toast.error("Cadastre um motivo de perda antes.");
                          return;
                        }
                        void definirResultado("perdido", escolhido);
                      }}
                    >
                      Perdido
                    </Button>

                    {d.resultado !== "aberto" && (
                      <Button size="sm" variant="ghost" onClick={() => void definirResultado("aberto", null)}>
                        Reabrir
                      </Button>
                    )}
                  </div>
                  {d.resultado === "perdido" && (
                    <Select
                      value={d.motivoPerdaId ?? ""}
                      onValueChange={(v) => void definirResultado("perdido", v)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Motivo da perda" />
                      </SelectTrigger>
                      <SelectContent>
                        {motivosAtivos.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </section>

              <Separator />

              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resultado
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-semibold">{d.scorePercentual}%</span>
                  {d.perfilTitulo && (
                    <Badge style={{ backgroundColor: d.perfilCor ?? undefined }} className="text-background">
                      {d.perfilTitulo}
                    </Badge>
                  )}
                </div>
                {d.perfilDescricao && (
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{d.perfilDescricao}</p>
                )}
                <div className="mt-4 space-y-3">
                  {d.dimensoes.map((dim) => (
                    <div key={dim.titulo}>
                      <div className="flex items-center justify-between text-xs font-medium text-foreground">
                        <span>{dim.titulo}</span>
                        <span>{dim.scorePercentual}%</span>

                      </div>
                      <Progress value={dim.scorePercentual} className="mt-1 h-1.5" />

                    </div>
                  ))}
                </div>
              </section>

              {d.distribuicao.length > 1 && (
                <PerfilDistribuicao fatias={d.distribuicao} />
              )}

              {d.perfilConteudo && (
                <PerfilConteudo conteudo={d.perfilConteudo} perfilTitulo={d.perfilTitulo} />
              )}



              {d.insights && (
                <section className="space-y-4">
                  <Separator />
                  {(
                    [
                      ["Pontos fortes", d.insights.pontosFortes],
                      ["Riscos", d.insights.riscos],
                      ["Próximos passos", d.insights.proximosPassos],
                    ] as const
                  ).map(([titulo, itens]) => (
                    <div key={titulo}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {titulo}
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#051d40]">
                        {(itens ?? []).map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              <Separator />

              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Anotações e histórico
                </p>
                <div className="mt-2">
                  <Textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Registrar uma conversa, combinação ou observação…"
                    rows={2}
                  />
                </div>

                <input
                  ref={inputArquivoRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const novos = Array.from(e.target.files ?? []);
                    if (novos.length) setArquivos((atual) => [...atual, ...novos].slice(0, 10));
                    e.target.value = "";
                  }}
                />

                {arquivos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {arquivos.map((a, i) => (
                      <span
                        key={`${a.name}-${i}`}
                        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs"
                      >
                        <Paperclip className="h-3 w-3" />
                        {a.name}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setArquivos((atual) => atual.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => void adicionarAnotacao()}
                    disabled={salvandoNota || (!texto.trim() && arquivos.length === 0)}
                  >
                    {salvandoNota && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Salvar anotação
                  </Button>
                  <Button
                    size="sm"
                    variant={gravando ? "destructive" : "outline"}
                    onClick={() => void alternarGravacao()}
                    disabled={transcrevendo}
                  >
                    {transcrevendo ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : gravando ? (
                      <MicOff className="mr-2 h-3.5 w-3.5" />
                    ) : (
                      <Mic className="mr-2 h-3.5 w-3.5" />
                    )}
                    {transcrevendo ? "Transcrevendo…" : gravando ? "Parar" : "Ditar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => inputArquivoRef.current?.click()}>
                    <Paperclip className="mr-2 h-3.5 w-3.5" />
                    Anexar
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    ...d.anotacoes.map((a) => ({ tipo: "anotacao" as const, criadoEm: a.criadoEm, anotacao: a })),
                    ...d.eventos.map((e) => ({ tipo: "evento" as const, criadoEm: e.criadoEm, evento: e })),
                  ]
                    .sort((x, y) => new Date(y.criadoEm).getTime() - new Date(x.criadoEm).getTime())
                    .map((item) =>
                      item.tipo === "anotacao" ? (
                        <div key={item.anotacao.id} className="rounded border border-border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground">{item.anotacao.texto}</p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={async () => {
                                try {
                                  await excluirAnotacaoFn({ data: { id: item.anotacao.id } });
                                  await queryClient.invalidateQueries({ queryKey: ["lead", id] });
                                } catch {
                                  toast.error("Não foi possível excluir a anotação.");
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {item.anotacao.anexos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.anotacao.anexos.map((anexo) => (
                                <button
                                  key={anexo.id}
                                  type="button"
                                  onClick={() => void abrirAnexo(anexo.id)}
                                  className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {anexo.nome}
                                  <span className="text-muted-foreground">
                                    ({Math.max(1, Math.round(anexo.tamanho / 1024))} KB)
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {item.anotacao.autorNome ?? "—"} ·{" "}
                            {new Date(item.anotacao.criadoEm).toLocaleString("pt-BR")}
                            {item.anotacao.origem === "ditado" ? " · ditado por voz" : ""}
                          </p>
                        </div>
                      ) : (
                        <p key={item.evento.id} className="text-[11px] text-muted-foreground">
                          {new Date(item.evento.criadoEm).toLocaleString("pt-BR")} · {item.evento.tipo}{" "}
                          {tituloEtapa(item.evento.de)} → {tituloEtapa(item.evento.para)}
                          {item.evento.autorNome ? ` · ${item.evento.autorNome}` : ""}
                        </p>
                      ),
                    )}
                </div>

              </section>

              <Separator />

              <section className="pb-2">
                <Button variant="outline" className="text-destructive" onClick={() => setConfirmarExclusao(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir lead
                </Button>
              </section>
            </div>

            <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
              <AlertDialogContent className="theme-painel">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {d.nome}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    As respostas do diagnóstico, anotações e todo o histórico desse lead serão apagados. Essa ação
                    não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void removerLead()}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

      </SheetContent>
    </Sheet>
  );
}
