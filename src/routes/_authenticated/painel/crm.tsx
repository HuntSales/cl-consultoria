import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { CalendarClock, Download, Search, Settings2, ThumbsDown, ThumbsUp, Trash2, Undo2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listarEtapas,
  listarLeads,
  listarMotivosPerda,
  listarOrigens,
  listarResponsaveis,
  marcarResultado,
  atualizarLead,
  excluirLead,
} from "@/lib/crm.functions";
import type { EtapaFunil, LeadResumo } from "@/lib/crm.functions";
import { obterMeuAcesso } from "@/lib/acesso.functions";
import { LeadDrawer } from "@/components/painel/LeadDrawer";
import { GerenciarEtapasDialog } from "@/components/painel/GerenciarEtapasDialog";
import { GerenciarMotivosDialog } from "@/components/painel/GerenciarMotivosDialog";
import { GerenciarOrigensDialog } from "@/components/painel/GerenciarOrigensDialog";

const leadsQueryOptions = queryOptions({ queryKey: ["leads"], queryFn: () => listarLeads() });
const etapasQueryOptions = queryOptions({ queryKey: ["crm-etapas"], queryFn: () => listarEtapas() });
const motivosQueryOptions = queryOptions({ queryKey: ["motivos-perda"], queryFn: () => listarMotivosPerda() });
const origensQueryOptions = queryOptions({ queryKey: ["origens"], queryFn: () => listarOrigens() });
const responsaveisQueryOptions = queryOptions({
  queryKey: ["responsaveis"],
  queryFn: () => listarResponsaveis(),
});

export const Route = createFileRoute("/_authenticated/painel/crm")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(leadsQueryOptions);
    context.queryClient.ensureQueryData(etapasQueryOptions);
    context.queryClient.prefetchQuery(motivosQueryOptions);
    context.queryClient.prefetchQuery(origensQueryOptions);
    context.queryClient.prefetchQuery(responsaveisQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "CRM de leads | Painel Cibele Lucena" },
      {
        name: "description",
        content: "Acompanhe os leads do diagnóstico financeiro por etapa do funil, com anotações e histórico.",
      },
    ],
  }),
  component: CrmPage,
});

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function CrmPage() {
  const { data: leads } = useSuspenseQuery(leadsQueryOptions);
  const { data: etapas } = useSuspenseQuery(etapasQueryOptions);
  const motivos = useQuery(motivosQueryOptions);
  const origens = useQuery(origensQueryOptions);
  const responsaveis = useQuery(responsaveisQueryOptions);
  const acesso = useQuery({ queryKey: ["meu-acesso"], queryFn: () => obterMeuAcesso() });
  const podeGerenciar = acesso.data?.papel === "master_admin";

  const queryClient = useQueryClient();
  const atualizar = useServerFn(atualizarLead);
  const remover = useServerFn(excluirLead);
  const marcar = useServerFn(marcarResultado);

  const [busca, setBusca] = useState("");
  const [diagnostico, setDiagnostico] = useState("todos");
  const [perfil, setPerfil] = useState("todos");
  const [responsavel, setResponsavel] = useState("todos");
  const [faixa, setFaixa] = useState("todos");
  const [leadAberto, setLeadAberto] = useState<string | null>(null);
  const [leadParaExcluir, setLeadParaExcluir] = useState<LeadResumo | null>(null);
  const [leadParaPerder, setLeadParaPerder] = useState<LeadResumo | null>(null);
  const [motivoEscolhido, setMotivoEscolhido] = useState("");
  const [gerenciarEtapas, setGerenciarEtapas] = useState(false);
  const [gerenciarMotivos, setGerenciarMotivos] = useState(false);
  const [gerenciarOrigens, setGerenciarOrigens] = useState(false);
  const [origemFiltro, setOrigemFiltro] = useState("todas");

  const motivosAtivos = (motivos.data ?? []).filter((m) => m.ativo);
  const origensAtivas = (origens.data ?? []).filter((o) => o.ativo);

  async function removerLead(lead: LeadResumo) {
    const anterior = queryClient.getQueryData<LeadResumo[]>(["leads"]);
    queryClient.setQueryData<LeadResumo[]>(["leads"], (atual) => (atual ?? []).filter((l) => l.id !== lead.id));
    if (leadAberto === lead.id) setLeadAberto(null);
    try {
      await remover({ data: { id: lead.id } });
      toast.success("Lead excluído.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
    } catch (erro) {
      if (anterior) queryClient.setQueryData(["leads"], anterior);
      toast.error(erro instanceof Error ? erro.message : "Não foi possível excluir o lead.");
    }
  }

  async function definirResultado(
    lead: LeadResumo,
    resultado: "aberto" | "ganho" | "perdido",
    motivoPerdaId: string | null = null,
  ) {
    const anterior = queryClient.getQueryData<LeadResumo[]>(["leads"]);
    queryClient.setQueryData<LeadResumo[]>(["leads"], (atual) =>
      (atual ?? []).map((l) =>
        l.id === lead.id
          ? {
              ...l,
              resultado,
              motivoPerdaId,
              motivoPerdaTitulo: motivosAtivos.find((m) => m.id === motivoPerdaId)?.titulo ?? null,
            }
          : l,
      ),
    );
    try {
      await marcar({ data: { id: lead.id, resultado, motivoPerdaId } });
      toast.success(
        resultado === "ganho" ? "Lead marcado como ganho." : resultado === "perdido" ? "Lead marcado como perdido." : "Lead reaberto.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["lead", lead.id] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
    } catch (erro) {
      if (anterior) queryClient.setQueryData(["leads"], anterior);
      toast.error(erro instanceof Error ? erro.message : "Não foi possível registrar o desfecho.");
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const diagnosticos = useMemo(
    () => Array.from(new Map(leads.map((l) => [l.diagnosticoId, l.diagnosticoTitulo])).entries()),
    [leads],
  );
  const perfis = useMemo(
    () => Array.from(new Set(leads.map((l) => l.perfilTitulo).filter((p): p is string => Boolean(p)))),
    [leads],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return leads.filter((l) => {
      if (termo && !`${l.nome} ${l.email}`.toLowerCase().includes(termo)) return false;
      if (diagnostico !== "todos" && l.diagnosticoId !== diagnostico) return false;
      if (perfil !== "todos" && l.perfilTitulo !== perfil) return false;
      if (responsavel !== "todos") {
        if (responsavel === "sem" ? l.responsavelId !== null : l.responsavelId !== responsavel) return false;
      }
      if (origemFiltro !== "todas") {
        if (origemFiltro === "sem" ? l.origemId !== null : l.origemId !== origemFiltro) return false;
      }
      if (faixa !== "todos") {
        const s = l.scorePercentual;
        if (faixa === "0-40" && s > 40) return false;
        if (faixa === "41-74" && (s < 41 || s > 74)) return false;
        if (faixa === "75-100" && s < 75) return false;
      }
      return true;
    });
  }, [leads, busca, diagnostico, perfil, responsavel, faixa, origemFiltro]);

  const primeiraEtapaId = etapas[0]?.id ?? null;

  async function moverLead(id: string, etapaId: string, titulo: string) {
    const anterior = queryClient.getQueryData<LeadResumo[]>(["leads"]);
    queryClient.setQueryData<LeadResumo[]>(["leads"], (atual) =>
      (atual ?? []).map((l) => (l.id === id ? { ...l, etapaId } : l)),
    );
    try {
      await atualizar({ data: { id, etapaId } });
      toast.success(`Lead movido para "${titulo}".`);
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (erro) {
      if (anterior) queryClient.setQueryData(["leads"], anterior);
      toast.error(erro instanceof Error ? erro.message : "Não foi possível mover o lead.");
    }
  }

  function onDragEnd(evento: DragEndEvent) {
    const etapaId = evento.over?.id ? String(evento.over.id) : undefined;
    const id = String(evento.active.id);
    if (!etapaId) return;
    const lead = leads.find((l) => l.id === id);
    const etapa = etapas.find((e) => e.id === etapaId);
    if (!lead || !etapa) return;
    const atualId = lead.etapaId ?? primeiraEtapaId;
    if (atualId === etapaId) return;
    void moverLead(id, etapaId, etapa.titulo);
  }

  function exportarCsv() {
    const cabecalho = [
      "Nome",
      "E-mail",
      "WhatsApp",
      "Diagnóstico",
      "Perfil",
      "Score %",
      "Profissão",
      "Renda",
      "Origem",
      "Etapa",
      "Desfecho",
      "Motivo da perda",
      "Responsável",
      "Próximo contato",
      "Valor estimado",
      "Criado em",
    ];
    const linhas = filtrados.map((l) => [
      l.nome,
      l.email,
      l.whatsapp ?? "",
      l.diagnosticoTitulo,
      l.perfilTitulo ?? "",
      String(l.scorePercentual),
      l.cargo ?? "",
      l.renda ?? "",
      l.origemTitulo ?? "",
      etapas.find((e) => e.id === (l.etapaId ?? primeiraEtapaId))?.titulo ?? "",
      l.resultado === "ganho" ? "Ganho" : l.resultado === "perdido" ? "Perdido" : "Em aberto",
      l.motivoPerdaTitulo ?? "",
      l.responsavelNome ?? "",
      l.proximoContato ?? "",
      l.valorEstimado === null ? "" : String(l.valorEstimado),
      new Date(l.criadoEm).toLocaleDateString("pt-BR"),
    ]);
    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold uppercase">CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtrados.length} lead{filtrados.length === 1 ? "" : "s"} no funil.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setGerenciarEtapas(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Etapas do funil
          </Button>
          <Button variant="outline" onClick={() => setGerenciarMotivos(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Motivos de perda
          </Button>
          <Button variant="outline" onClick={() => setGerenciarOrigens(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Origens
          </Button>
          <Button variant="outline" onClick={exportarCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou e-mail"
            className="pl-9"
          />
        </div>
        <Select value={diagnostico} onValueChange={setDiagnostico}>
          <SelectTrigger>
            <SelectValue placeholder="Diagnóstico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os diagnósticos</SelectItem>
            {diagnosticos.map(([id, titulo]) => (
              <SelectItem key={id} value={id}>
                {titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={perfil} onValueChange={setPerfil}>
          <SelectTrigger>
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            {perfis.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={responsavel} onValueChange={setResponsavel}>
          <SelectTrigger>
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            <SelectItem value="sem">Sem responsável</SelectItem>
            {(responsaveis.data ?? []).map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={faixa} onValueChange={setFaixa}>
          <SelectTrigger>
            <SelectValue placeholder="Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os scores</SelectItem>
            <SelectItem value="0-40">0 a 40%</SelectItem>
            <SelectItem value="41-74">41 a 74%</SelectItem>
            <SelectItem value="75-100">75 a 100%</SelectItem>
          </SelectContent>
        </Select>
        <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
          <SelectTrigger>
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as origens</SelectItem>
            <SelectItem value="sem">Sem origem</SelectItem>
            {origensAtivas.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {etapas.map((etapa) => (
            <Coluna
              key={etapa.id}
              etapa={etapa}
              leads={filtrados.filter(
                (l) => (l.etapaId ?? primeiraEtapaId) === etapa.id,
              )}
              onAbrir={setLeadAberto}
              onExcluir={setLeadParaExcluir}
              onGanho={(lead) => void definirResultado(lead, "ganho")}
              onPerdido={(lead) => {
                setLeadParaPerder(lead);
                setMotivoEscolhido(lead.motivoPerdaId ?? "");
              }}
              onReabrir={(lead) => void definirResultado(lead, "aberto")}
            />
          ))}

          {etapas.length === 0 && (
            <p className="rounded border border-dashed border-border p-6 text-sm text-muted-foreground">
              Nenhuma etapa cadastrada. Use “Etapas do funil” para criar a primeira.
            </p>
          )}
        </div>
      </DndContext>

      <LeadDrawer id={leadAberto} onClose={() => setLeadAberto(null)} />

      <GerenciarOrigensDialog
        aberto={gerenciarOrigens}
        onOpenChange={setGerenciarOrigens}
        podeEditar={Boolean(podeGerenciar)}
      />

      <GerenciarEtapasDialog
        aberto={gerenciarEtapas}
        onOpenChange={setGerenciarEtapas}
        podeEditar={Boolean(podeGerenciar)}
      />
      <GerenciarMotivosDialog
        aberto={gerenciarMotivos}
        onOpenChange={setGerenciarMotivos}
        podeEditar={Boolean(podeGerenciar)}
      />

      <Dialog
        open={leadParaPerder !== null}
        onOpenChange={(aberto) => !aberto && setLeadParaPerder(null)}
      >
        <DialogContent className="theme-painel sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar {leadParaPerder?.nome} como perdido</DialogTitle>
            <DialogDescription>Escolha o motivo da perda na lista cadastrada.</DialogDescription>
          </DialogHeader>

          <Select value={motivoEscolhido} onValueChange={setMotivoEscolhido}>
            <SelectTrigger>
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

          <Button
            variant="link"
            className="h-auto justify-start p-0 text-xs"
            onClick={() => setGerenciarMotivos(true)}
          >
            <Settings2 className="mr-1 h-3 w-3" />
            Gerenciar motivos de perda
          </Button>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeadParaPerder(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!motivoEscolhido}
              onClick={() => {
                if (leadParaPerder && motivoEscolhido) {
                  void definirResultado(leadParaPerder, "perdido", motivoEscolhido);
                }
                setLeadParaPerder(null);
              }}
            >
              Confirmar perda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={leadParaExcluir !== null}
        onOpenChange={(aberto) => !aberto && setLeadParaExcluir(null)}
      >
        <AlertDialogContent className="theme-painel">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {leadParaExcluir?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              As respostas do diagnóstico, anotações e todo o histórico desse lead serão apagados. Essa ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (leadParaExcluir) void removerLead(leadParaExcluir);
                setLeadParaExcluir(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Coluna({
  etapa,
  leads,
  onAbrir,
  onExcluir,
  onGanho,
  onPerdido,
  onReabrir,
}: {
  etapa: EtapaFunil;
  leads: LeadResumo[];
  onAbrir: (id: string) => void;
  onExcluir: (lead: LeadResumo) => void;
  onGanho: (lead: LeadResumo) => void;
  onPerdido: (lead: LeadResumo) => void;
  onReabrir: (lead: LeadResumo) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  const total = leads.reduce((acc, l) => acc + (l.valorEstimado ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border bg-card/60 p-3 transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: etapa.cor }} />
            {etapa.titulo}
          </span>
          <Badge variant="secondary">{leads.length}</Badge>
        </div>
        {total > 0 && <p className="mt-1 text-xs text-muted-foreground">{moeda.format(total)}</p>}
      </div>
      <div className="flex flex-col gap-2">
        {leads.map((lead) => (
          <CartaoLead
            key={lead.id}
            lead={lead}
            onAbrir={onAbrir}
            onExcluir={onExcluir}
            onGanho={onGanho}
            onPerdido={onPerdido}
            onReabrir={onReabrir}
          />
        ))}

        {leads.length === 0 && (
          <p className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Nenhum lead
          </p>
        )}
      </div>
    </div>
  );
}

const PALETA_PERFIL = [
  "#2f7dd1", // azul
  "#c8862a", // âmbar
  "#7b5ea7", // roxo
  "#0f9b8e", // teal
  "#c2557a", // rosa
  "#5f8f2f", // oliva
  "#d0b266", // dourado
  "#4c6b8a", // azul acinzentado
];

function corPerfil(titulo: string | null, corOriginal: string | null): string {
  const t = (titulo ?? "").toLowerCase();
  if (t.includes("saudável")) return "#05AA7B";
  if (t.includes("tensão")) return "#c0392b";
  if (!titulo) return corOriginal ?? "#4c6b8a";
  let hash = 0;
  for (let i = 0; i < titulo.length; i += 1) hash = (hash * 31 + titulo.charCodeAt(i)) % 100000;
  return PALETA_PERFIL[hash % PALETA_PERFIL.length];
}

function CartaoLead({
  lead,
  onAbrir,
  onExcluir,
  onGanho,
  onPerdido,
  onReabrir,
}: {
  lead: LeadResumo;
  onAbrir: (id: string) => void;
  onExcluir: (lead: LeadResumo) => void;
  onGanho: (lead: LeadResumo) => void;
  onPerdido: (lead: LeadResumo) => void;
  onReabrir: (lead: LeadResumo) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const atrasado =
    lead.proximoContato !== null && new Date(lead.proximoContato) < new Date(new Date().toDateString());

  const cor = corPerfil(lead.perfilTitulo, lead.perfilCor);

  const borda =
    lead.resultado === "ganho"
      ? "border-[#05AA7B]/40"
      : lead.resultado === "perdido"
        ? "border-destructive/30"
        : "border-border hover:border-primary/40";

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={`group relative w-full overflow-hidden rounded-md border bg-background shadow-sm transition ${borda} ${
        isDragging ? "z-50 opacity-90 shadow-lg" : ""
      }`}
    >
      {lead.perfilTitulo && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ backgroundColor: cor }}
        />
      )}
      <button
        type="button"
        onClick={() => onAbrir(lead.id)}
        className="block w-full p-3 pl-4 text-left"
        {...listeners}
        {...attributes}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-tight">{lead.nome}</span>
          <span className="mr-6 text-xs font-semibold text-muted-foreground">{lead.scorePercentual}%</span>
        </div>
        {lead.perfilTitulo && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] font-medium leading-snug text-foreground/85">
            <span
              aria-hidden="true"
              className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: cor }}
            />
            <span className="line-clamp-2">{lead.perfilTitulo}</span>
          </p>
        )}

        <p className="mt-2 truncate text-xs text-foreground/80">{lead.diagnosticoTitulo}</p>
        {lead.origemTitulo && (
          <span className="mt-2 inline-block rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
            {lead.origemTitulo}
          </span>
        )}
        {(lead.cargo || lead.renda) && (
          <p className="mt-1 truncate text-[11px] font-medium text-foreground/90">
            {[lead.cargo, lead.renda].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-1 truncate text-[11px] text-foreground/75">{lead.email}</p>
        {lead.whatsapp && <p className="truncate text-[11px] text-foreground/75">{lead.whatsapp}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground/70">
          <span>{new Date(lead.criadoEm).toLocaleDateString("pt-BR")}</span>
          {lead.responsavelNome && <span>· {lead.responsavelNome}</span>}
          {atrasado && lead.resultado === "aberto" && (
            <span className="flex items-center gap-1 font-medium text-destructive">
              <CalendarClock className="h-3 w-3" />
              contato atrasado
            </span>
          )}
        </div>
        {lead.resultado === "perdido" && lead.motivoPerdaTitulo && (
          <p className="mt-2 text-[11px] font-medium text-destructive">Perdido · {lead.motivoPerdaTitulo}</p>
        )}
      </button>

      <div
        className="flex items-center gap-1 border-t border-border/70 px-2 py-1.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {lead.resultado === "aberto" ? (
          <>
            <Button
              size="sm"
              className="h-7 flex-1 gap-1 rounded-md bg-[#05AA7B] text-[11px] font-semibold text-white shadow-none hover:bg-[#048b64]"
              onClick={(e) => {
                e.stopPropagation();
                onGanho(lead);
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Ganho
            </Button>
            <Button
              size="sm"
              className="h-7 flex-1 gap-1 rounded-md bg-[#c0392b] text-[11px] font-semibold text-white shadow-none hover:bg-[#a52f23]"
              onClick={(e) => {
                e.stopPropagation();
                onPerdido(lead);
              }}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              Perdido
            </Button>

          </>
        ) : (
          <>
            <span
              className={`flex-1 text-[11px] font-semibold uppercase tracking-wider ${
                lead.resultado === "ganho" ? "text-[#05AA7B]" : "text-destructive"
              }`}
            >
              {lead.resultado === "ganho" ? "Ganho" : "Perdido"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-[11px] text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onReabrir(lead);
              }}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Reabrir
            </Button>
          </>
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        aria-label={`Excluir lead ${lead.nome}`}
        className="absolute right-1 top-1 h-6 w-6 text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onExcluir(lead);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
