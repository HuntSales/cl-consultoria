import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquarePlus, Mic, Save, Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatarCpf } from "@/lib/cpf";
import { SUGESTOES_PROMPT } from "@/lib/prompts-sugeridos";
import {
  excluirConversa,
  listarConversas,
  obterClienteGestao,
  obterConversa,
  perguntarAgente,
  salvarConversa,
  transcreverAudio,
} from "@/lib/gestao.functions";

export const Route = createFileRoute("/_authenticated/painel/gestao/$clienteId")({
  head: () => ({
    meta: [
      { title: "Agente do cliente | Painel Cibele Lucena" },
      { name: "description", content: "Peça insights ao agente com acesso aos diagnósticos, ao CRM e ao MyMoney." },
      { property: "og:title", content: "Agente do cliente | Painel Cibele Lucena" },
      { property: "og:description", content: "Insights do agente com contexto completo do cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgenteClientePage,
});

type Mensagem = { papel: "user" | "assistant"; conteudo: string };

function AgenteClientePage() {
  const { clienteId } = Route.useParams();
  const queryClient = useQueryClient();

  const obterClienteFn = useServerFn(obterClienteGestao);
  const perguntarFn = useServerFn(perguntarAgente);
  const transcreverFn = useServerFn(transcreverAudio);
  const salvarConversaFn = useServerFn(salvarConversa);
  const listarConversasFn = useServerFn(listarConversas);
  const obterConversaFn = useServerFn(obterConversa);
  const excluirConversaFn = useServerFn(excluirConversa);

  const cliente = useQuery({
    queryKey: ["cliente-gestao", clienteId],
    queryFn: () => obterClienteFn({ data: { id: clienteId } }),
  });
  const conversas = useQuery({
    queryKey: ["conversas", clienteId],
    queryFn: () => listarConversasFn({ data: { clienteId } }),
  });

  const [prompt, setPrompt] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pensando, setPensando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [conversaAberta, setConversaAberta] = useState<string | null>(null);
  const [retomada, setRetomada] = useState<{ id: string; titulo: string; jaSalvas: number } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function enviar(texto: string) {
    const pergunta = texto.trim();
    if (!pergunta || pensando) return;
    setPensando(true);
    const historico = mensagens.slice(-20);
    setMensagens((prev) => [...prev, { papel: "user", conteudo: pergunta }]);
    setPrompt("");
    try {
      const { resposta } = await perguntarFn({ data: { clienteId, pergunta, historico } });
      setMensagens((prev) => [...prev, { papel: "assistant", conteudo: resposta }]);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "O agente não respondeu.");
    } finally {
      setPensando(false);
    }
  }

  async function retomarConversa(id: string, titulo: string) {
    if (retomada?.id === id) return;
    const naoSalvas = retomada ? mensagens.length - retomada.jaSalvas : mensagens.length;
    if (naoSalvas > 0) {
      toast.error("Salve ou descarte a conversa em andamento antes de retomar outra.");
      return;
    }
    try {
      const detalhe = await obterConversaFn({ data: { id } });
      setMensagens(detalhe.mensagens.map((m) => ({ papel: m.papel as Mensagem["papel"], conteudo: m.conteudo })));
      setRetomada({ id, titulo: detalhe.titulo, jaSalvas: detalhe.mensagens.length });
      setConversaAberta(null);
    } catch {
      toast.error("Não foi possível abrir esse histórico.");
    }
  }

  function descartar() {
    setMensagens([]);
    setRetomada(null);
  }

  async function alternarGravacao() {
    if (gravando) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setGravando(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 2048) {
          toast.error("Gravação muito curta. Tente novamente.");
          return;
        }
        setTranscrevendo(true);
        try {
          const buffer = await blob.arrayBuffer();
          let binario = "";
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i]!);
          const { texto } = await transcreverFn({
            data: { audioBase64: btoa(binario), mime: blob.type },
          });
          setPrompt((atual) => (atual ? `${atual} ${texto}` : texto));
        } catch (erro) {
          toast.error(erro instanceof Error ? erro.message : "Não foi possível transcrever o áudio.");
        } finally {
          setTranscrevendo(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setGravando(true);
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  }

  async function guardarHistorico() {
    if (mensagens.length === 0) return;
    const novas = retomada ? mensagens.slice(retomada.jaSalvas) : mensagens;
    if (novas.length === 0) {
      toast.info("Nada novo para salvar nesse histórico.");
      return;
    }
    const titulo = retomada?.titulo ?? (mensagens[0]?.conteudo ?? "Consulta ao agente").slice(0, 80);
    try {
      await salvarConversaFn({
        data: { clienteId, conversaId: retomada?.id ?? null, titulo, mensagens: novas },
      });
      setMensagens([]);
      setRetomada(null);
      await queryClient.invalidateQueries({ queryKey: ["conversas", clienteId] });
      if (retomada) await queryClient.invalidateQueries({ queryKey: ["conversa", retomada.id] });
      toast.success("Histórico salvo na linha do tempo.");
    } catch {
      toast.error("Não foi possível salvar o histórico.");
    }
  }

  async function abrirHistorico(id: string) {
    if (conversaAberta === id) {
      setConversaAberta(null);
      return;
    }
    setConversaAberta(id);
    await queryClient.prefetchQuery({
      queryKey: ["conversa", id],
      queryFn: () => obterConversaFn({ data: { id } }),
    });
  }

  const detalhe = useQuery({
    queryKey: ["conversa", conversaAberta],
    queryFn: () => obterConversaFn({ data: { id: conversaAberta! } }),
    enabled: Boolean(conversaAberta),
  });

  const d = cliente.data;

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/painel/gestao">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Clientes
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold uppercase tracking-wide">{d?.nome ?? "Cliente"}</h1>
        {d && (
          <p className="mt-1 text-sm text-muted-foreground">
            {formatarCpf(d.cpf)} ·{" "}
            {d.vinculo.encontrado
              ? `${d.vinculo.totalDiagnosticos} diagnóstico(s) vinculado(s)`
              : "sem diagnósticos vinculados"}
          </p>
        )}
      </div>


      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Consultar o agente</h2>

        {retomada && (
          <p className="rounded-md border border-accent/40 bg-secondary px-3 py-2 text-xs text-foreground">
            Continuando o histórico: <span className="font-medium">{retomada.titulo}</span>
          </p>
        )}

        {mensagens.length > 0 && (
          <div className="space-y-3">
            {mensagens.map((m, i) => (
              <div
                key={`${m.papel}-${i}`}
                className={`rounded-lg border p-4 text-sm ${
                  m.papel === "user"
                    ? "border-border bg-secondary text-foreground"
                    : "border-accent/40 bg-card text-foreground"
                }`}
              >
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {m.papel === "user" ? "Você" : "Agente"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.conteudo}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void guardarHistorico()}>
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                Salvar histórico
              </Button>
              <Button size="sm" variant="ghost" onClick={descartar}>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Descartar
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2">
          <Textarea
            value={prompt}
            rows={4}
            placeholder="Peça uma análise, um plano de ação ou um roteiro de reunião…"
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1"
          />
          <div className="flex flex-col gap-2">
            <Button
              variant={gravando ? "destructive" : "outline"}
              size="icon"
              disabled={transcrevendo}
              aria-label={gravando ? "Parar gravação" : "Ditar pergunta"}
              onClick={() => void alternarGravacao()}
            >
              {transcrevendo ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : gravando ? (
                <Square className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Mic className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button size="icon" disabled={pensando || !prompt.trim()} aria-label="Enviar" onClick={() => void enviar(prompt)}>
              {pensando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGESTOES_PROMPT.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Linha do tempo de insights</h2>
        {(conversas.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum histórico salvo ainda.</p>
        ) : (
          <div className="space-y-2">
            {(conversas.data ?? []).map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between gap-3 p-4">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void abrirHistorico(c.id)}>
                    <p className="truncate text-sm font-medium text-foreground">{c.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.criadoEm).toLocaleString("pt-BR")}
                      {c.atualizadoEm && c.atualizadoEm !== c.criadoEm
                        ? ` · atualizado em ${new Date(c.atualizadoEm).toLocaleString("pt-BR")}`
                        : ""}
                    </p>
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={retomada?.id === c.id}
                    onClick={() => void retomarConversa(c.id, c.titulo)}
                  >
                    <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    {retomada?.id === c.id ? "Em andamento" : "Retomar conversa"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Excluir histórico"
                    onClick={async () => {
                      try {
                        await excluirConversaFn({ data: { id: c.id } });
                        if (conversaAberta === c.id) setConversaAberta(null);
                        if (retomada?.id === c.id) descartar();
                        await queryClient.invalidateQueries({ queryKey: ["conversas", clienteId] });
                      } catch {
                        toast.error("Não foi possível excluir.");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                {conversaAberta === c.id && (
                  <div className="space-y-3 border-t border-border p-4">
                    {detalhe.isLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando…</p>
                    ) : (
                      (detalhe.data?.mensagens ?? []).map((m) => (
                        <div key={m.id}>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            {m.papel === "user" ? "Você" : "Agente"}
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{m.conteudo}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
