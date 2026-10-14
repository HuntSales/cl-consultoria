import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Save,
  Eye,
  Layers,
  HelpCircle,
  Trophy,
  Scale,
  FileText,

} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

import {
  obterDiagnostico,
  salvarDimensao,
  excluirDimensao,
  reordenarDimensoes,
  salvarPergunta,
  excluirPergunta,
  reordenarPerguntas,
  salvarPerfilResultado,
  excluirPerfilResultado,
  reordenarPerfis,
  atualizarDiagnostico,
  calcularScorePreview,
} from "@/lib/diagnosticos.functions";
import { PontuacaoTab } from "@/components/painel/PontuacaoTab";
import { RegrasEditor } from "@/components/painel/RegrasEditor";
import type { RegraPerfil } from "@/lib/scoring";
import type { DimensaoCompleta, PerguntaCompleta, PerfilResultado, OpcaoResposta } from "@/lib/diagnosticos.functions";

function diagnosticoQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["diagnostico", id],
    queryFn: () => obterDiagnostico({ data: { id } }),
  });
}

export const Route = createFileRoute("/_authenticated/painel/diagnosticos/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(diagnosticoQueryOptions(params.id)),
  component: EditorDiagnosticoPage,
});

function EditorDiagnosticoPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(diagnosticoQueryOptions(id));
  const [aba, setAba] = useState("capa");


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/painel/diagnosticos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Diagnósticos
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-wide">{data.titulo}</h1>
            <Badge variant={data.status === "publicado" ? "default" : "secondary"}>
              {data.status === "publicado" ? "Publicado" : "Rascunho"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">/{data.slug}</p>
          {data.status === "publicado" && <LinkPublico slug={data.slug} />}
        </div>
        <PublicarToggle id={id} status={data.status} />
      </div>

      <Tabs value={aba} onValueChange={setAba} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-6">
          <TabsTrigger value="capa">
            <FileText className="mr-2 h-4 w-4" />
            Capa
          </TabsTrigger>
          <TabsTrigger value="dimensoes">
            <Layers className="mr-2 h-4 w-4" />
            Dimensões
          </TabsTrigger>
          <TabsTrigger value="perguntas">
            <HelpCircle className="mr-2 h-4 w-4" />
            Perguntas
          </TabsTrigger>
          <TabsTrigger value="pontuacao">
            <Scale className="mr-2 h-4 w-4" />
            Pontuação
          </TabsTrigger>
          <TabsTrigger value="perfis">
            <Trophy className="mr-2 h-4 w-4" />
            Perfis
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capa" className="mt-6">
          <CapaTab
            id={id}
            titulo={data.titulo}
            descricao={data.descricao}
            capaItens={data.capaItens}
            linkAgendamento={data.linkAgendamento}
            dimensoes={data.dimensoes}
          />
        </TabsContent>
        <TabsContent value="dimensoes" className="mt-6">
          <DimensoesTab id={id} dimensoes={data.dimensoes} />
        </TabsContent>
        <TabsContent value="perguntas" className="mt-6">
          <PerguntasTab id={id} dimensoes={data.dimensoes} />
        </TabsContent>
        <TabsContent value="pontuacao" className="mt-6">
          <PontuacaoTab id={id} dimensoes={data.dimensoes} />
        </TabsContent>
        <TabsContent value="perfis" className="mt-6">
          <PerfisTab id={id} perfis={data.perfis} dimensoes={data.dimensoes} />
        </TabsContent>
        <TabsContent value="preview" className="mt-6">
          <PreviewTab id={id} dimensoes={data.dimensoes} perfis={data.perfis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LinkPublico({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/d/${slug}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Link público copiado.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <code className="rounded bg-secondary px-2 py-1 text-xs text-foreground">/d/{slug}</code>
      <Button variant="outline" size="sm" onClick={copiar}>
        {copiado ? "Copiado" : "Copiar link público"}
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <a href={`/d/${slug}`} target="_blank" rel="noreferrer">
          Abrir
        </a>
      </Button>
    </div>
  );
}


function PublicarToggle({ id, status }: { id: string; status: "publicado" | "rascunho" }) {
  const atualizar = useServerFn(atualizarDiagnostico);
  const [carregando, setCarregando] = useState(false);

  async function toggle() {
    setCarregando(true);
    const novo = status === "publicado" ? "rascunho" : "publicado";
    try {
      await atualizar({ data: { id, status: novo } });
      toast.success(novo === "publicado" ? "Diagnóstico publicado." : "Diagnóstico despublicado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao alterar status.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Button
      onClick={toggle}
      disabled={carregando}
      variant={status === "publicado" ? "outline" : "default"}
      className={status === "publicado" ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}
    >
      {status === "publicado" ? "Despublicar" : "Publicar"}
    </Button>
  );
}

/* ─── CAPA (texto inicial do questionário) ─── */
function CapaTab({
  id,
  titulo,
  descricao,
  capaItens,
  linkAgendamento,
  dimensoes,
}: {
  id: string;
  titulo: string;
  descricao: string | null;
  capaItens: string | null;
  linkAgendamento: string | null;
  dimensoes: DimensaoCompleta[];
}) {
  const atualizar = useServerFn(atualizarDiagnostico);
  const queryClient = useQueryClient();
  const [tituloValor, setTituloValor] = useState(titulo);
  const [descricaoValor, setDescricaoValor] = useState(descricao ?? "");
  const [itensValor, setItensValor] = useState(capaItens ?? "");
  const [linkValor, setLinkValor] = useState(linkAgendamento ?? "");
  const [salvando, setSalvando] = useState(false);

  const totalComum = dimensoes
    .filter((d) => d.ramo === "comum")
    .reduce((acc, d) => acc + d.perguntas.length, 0);

  const itensPreview = itensValor
    .split("\n")
    .map((l) => l.replace(/^[·•-]\s*/, "").trim())
    .filter(Boolean);

  const numerosNaDescricao = (descricaoValor.match(/\d+/g) ?? []).map(Number);
  const divergente = numerosNaDescricao.length > 0 && !numerosNaDescricao.includes(totalComum);

  async function salvar() {
    setSalvando(true);
    try {
      await atualizar({
        data: {
          id,
          titulo: tituloValor,
          descricao: descricaoValor,
          capaItens: itensValor,
          linkAgendamento: linkValor,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
      toast.success("Texto da capa atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Texto da capa do questionário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="capa-titulo">Título</Label>
          <Input id="capa-titulo" value={tituloValor} onChange={(e) => setTituloValor(e.target.value)} maxLength={120} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capa-descricao">Descrição</Label>
          <Textarea
            id="capa-descricao"
            rows={4}
            value={descricaoValor}
            onChange={(e) => setDescricaoValor(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            O diagnóstico tem hoje <strong>{totalComum}</strong> perguntas no bloco comum.
          </p>
          {divergente && (
            <p className="text-xs text-destructive">
              Atenção: a descrição menciona um número diferente de {totalComum} perguntas.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="capa-link">Link de agendamento da devolutiva</Label>
          <Input
            id="capa-link"
            type="url"
            value={linkValor}
            onChange={(e) => setLinkValor(e.target.value)}
            maxLength={500}
            placeholder="https://calendly.com/cibelelucena/devolutiva"
          />
          <p className="text-xs text-muted-foreground">
            Usado no botão “Agendar devolutiva agora” na tela de resultado e no e-mail enviado ao respondente.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capa-itens">Tópicos da capa (um por linha)</Label>
          <Textarea
            id="capa-itens"
            rows={4}
            value={itensValor}
            onChange={(e) => setItensValor(e.target.value)}
            maxLength={1000}
            placeholder={`${totalComum} perguntas objetivas\nUma pergunta por vez, com opção de voltar\nCerca de ${Math.max(2, Math.round(totalComum * 0.4))} minutos`}
          />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para gerar os tópicos automaticamente a partir da contagem real de perguntas.
          </p>
          {itensPreview.length > 0 && (
            <ul className="mt-2 space-y-1 rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              {itensPreview.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          )}
        </div>

        <Button onClick={salvar} disabled={salvando}>
          <Save className="mr-2 h-4 w-4" />
          Salvar capa
        </Button>
      </CardContent>
    </Card>
  );
}



const RAMO_LABEL: Record<string, string> = {
  comum: "Comum",
  solteiro: "Individual",
  casal: "Casal",
};

/* ─── DIMENSÕES ─── */
const dimensaoSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().min(2).max(120),
  descricao: z.string().max(500).optional(),
  pesoDimensao: z.coerce.number().min(0.1).max(10),
  ramo: z.enum(["comum", "solteiro", "casal"]),
});

type DimensaoForm = z.infer<typeof dimensaoSchema>;

function DimensoesTab({ id, dimensoes }: { id: string; dimensoes: DimensaoCompleta[] }) {
  const salvar = useServerFn(salvarDimensao);
  const excluir = useServerFn(excluirDimensao);
  const reordenar = useServerFn(reordenarDimensoes);
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<DimensaoForm | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  const form = useForm<DimensaoForm>({
    resolver: zodResolver(dimensaoSchema),
    defaultValues: { titulo: "", descricao: "", pesoDimensao: 1, ramo: "comum" },
  });

  async function abrirNova() {
    setEditando(null);
    form.reset({ titulo: "", descricao: "", pesoDimensao: 1, ramo: "comum" });
  }

  async function abrirEdicao(dim: DimensaoCompleta) {
    setEditando({
      id: dim.id,
      titulo: dim.titulo,
      descricao: dim.descricao || "",
      pesoDimensao: dim.pesoDimensao,
      ramo: dim.ramo ?? "comum",
    });
    form.reset({
      id: dim.id,
      titulo: dim.titulo,
      descricao: dim.descricao || "",
      pesoDimensao: dim.pesoDimensao,
      ramo: dim.ramo ?? "comum",
    });
  }

  async function onSubmit(values: DimensaoForm) {
    try {
      await salvar({
        data: {
          id: values.id,
          diagnosticoId: id,
          titulo: values.titulo,
          descricao: values.descricao || undefined,
          pesoDimensao: values.pesoDimensao,
          ramo: values.ramo,
          ordem: editando ? dimensoes.find((d) => d.id === values.id)?.ordem ?? 0 : dimensoes.length,
        },
      });
      toast.success(values.id ? "Dimensão atualizada." : "Dimensão criada.");
      setEditando(null);
      form.reset({ titulo: "", descricao: "", pesoDimensao: 1, ramo: "comum" });
      queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
    } catch (e) {
      toast.error("Erro ao salvar dimensão.");
    }
  }

  async function mover(index: number, direcao: -1 | 1) {
    const novaOrdem = [...dimensoes];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= novaOrdem.length) return;
    [novaOrdem[index], novaOrdem[alvo]] = [novaOrdem[alvo], novaOrdem[index]];
    await reordenar({ data: { diagnosticoId: id, ordem: novaOrdem.map((d) => d.id) } });
    queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
  }

  async function confirmarExclusao() {
    if (!excluirId) return;
    try {
      await excluir({ data: { id: excluirId } });
      toast.success("Dimensão excluída.");
      queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
    } catch (e) {
      toast.error("Erro ao excluir dimensão.");
    } finally {
      setExcluirId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Dimensões avaliadas no diagnóstico. Cada uma pode ter peso diferente.</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={abrirNova} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nova dimensão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar dimensão" : "Nova dimensão"}</DialogTitle>
            </DialogHeader>
            <DimensaoFormUI form={form} onSubmit={onSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {dimensoes.map((dim, index) => (
          <Card key={dim.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium">{dim.titulo}</h3>
                <p className="text-sm text-muted-foreground">{dim.descricao || "Sem descrição"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Peso: {dim.pesoDimensao.toFixed(1)} · Ramo: {RAMO_LABEL[dim.ramo ?? "comum"]}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => mover(index, -1)} disabled={index === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => mover(index, 1)} disabled={index === dimensoes.length - 1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => abrirEdicao(dim)}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setExcluirId(dim.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!excluirId} onOpenChange={() => setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dimensão?</AlertDialogTitle>
            <AlertDialogDescription>Todas as perguntas e opções vinculadas serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExcluirId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DimensaoFormUI({ form, onSubmit }: { form: ReturnType<typeof useForm<DimensaoForm>>; onSubmit: (values: DimensaoForm) => void }) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" {...form.register("titulo")} />
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" rows={3} {...form.register("descricao")} />
      </div>
      <div>
        <Label htmlFor="peso">Peso da dimensão</Label>
        <Input id="peso" type="number" step="0.1" min="0.1" max="10" {...form.register("pesoDimensao")} />
      </div>
      <div>
        <Label htmlFor="ramo">Ramo (quando esta dimensão aparece)</Label>
        <select
          id="ramo"
          {...form.register("ramo")}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="comum">Sempre (comum)</option>
          <option value="solteiro">Só na trilha individual</option>
          <option value="casal">Só na trilha para casais</option>
        </select>
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        Salvar
      </Button>
    </form>
  );
}

/* ─── PERGUNTAS ─── */
const perguntaSchema = z.object({
  id: z.string().uuid().optional(),
  dimensaoId: z.string().uuid(),
  texto: z.string().min(5).max(600),
  obrigatoria: z.boolean(),
  ramifica: z.boolean(),
  opcoes: z

    .array(
      z.object({
        id: z.string().uuid().optional(),
        texto: z.string().min(1).max(300),
        peso: z.coerce.number().min(0).max(1000),
        letra: z.string().max(4).optional(),
        ramo: z.enum(["comum", "solteiro", "casal"]).nullish(),
        rotulo: z.string().max(160).optional(),
        rotuloDescricao: z.string().max(600).optional(),
      }),
    )
    .min(1),
});

type PerguntaForm = z.infer<typeof perguntaSchema>;

function PerguntasTab({ id, dimensoes }: { id: string; dimensoes: DimensaoCompleta[] }) {
  const salvar = useServerFn(salvarPergunta);
  const excluir = useServerFn(excluirPergunta);
  const reordenar = useServerFn(reordenarPerguntas);
  const queryClient = useQueryClient();
  const [dimensaoAtiva, setDimensaoAtiva] = useState<string>(dimensoes[0]?.id || "");
  const [editando, setEditando] = useState<PerguntaForm | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  const dimensao = dimensoes.find((d) => d.id === dimensaoAtiva);
  const perguntas = dimensao?.perguntas ?? [];

  const form = useForm<PerguntaForm>({
    resolver: zodResolver(perguntaSchema),
    defaultValues: {
      dimensaoId: dimensaoAtiva,
      texto: "",
      obrigatoria: true,
      ramifica: false,
      opcoes: [{ texto: "", peso: 0 }],
    },
  });

  function abrirNova() {
    setEditando(null);
    form.reset({
      dimensaoId: dimensaoAtiva,
      texto: "",
      obrigatoria: true,
      ramifica: false,
      opcoes: [{ texto: "", peso: 0 }],
    });
  }

  function abrirEdicao(perg: PerguntaCompleta) {
    const opcoes = perg.opcoes.map((o) => ({
      id: o.id,
      texto: o.texto,
      peso: o.peso,
      letra: o.letra || "",
      ramo: o.ramo ?? null,
      rotulo: o.rotulo || "",
      rotuloDescricao: o.rotuloDescricao || "",
    }));
    setEditando({
      id: perg.id,
      dimensaoId: perg.dimensaoId,
      texto: perg.texto,
      obrigatoria: perg.obrigatoria,
      ramifica: perg.ramifica ?? false,
      opcoes,
    });
    form.reset({
      id: perg.id,
      dimensaoId: perg.dimensaoId,
      texto: perg.texto,
      obrigatoria: perg.obrigatoria,
      ramifica: perg.ramifica ?? false,
      opcoes,
    });
  }

  async function onSubmit(values: PerguntaForm) {
    try {
      await salvar({
        data: {
          id: values.id,
          dimensaoId: values.dimensaoId,
          texto: values.texto,
          obrigatoria: values.obrigatoria,
          ramifica: values.ramifica,
          ordem: editando
            ? perguntas.find((p) => p.id === values.id)?.ordem ?? 0
            : perguntas.length,
          opcoes: values.opcoes.map((o, i) => ({
            id: o.id,
            texto: o.texto,
            peso: o.peso,
            ordem: i,
            letra: o.letra || undefined,
            ramo: o.ramo ?? null,
            rotulo: o.rotulo || undefined,
            rotuloDescricao: o.rotuloDescricao || undefined,
          })),
        },
      });
      toast.success(values.id ? "Pergunta atualizada." : "Pergunta criada.");
      setEditando(null);
      abrirNova();
      queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
    } catch (e) {
      toast.error("Erro ao salvar pergunta.");
    }
  }

  async function mover(index: number, direcao: -1 | 1) {
    if (!dimensao) return;
    const novaOrdem = [...perguntas];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= novaOrdem.length) return;
    [novaOrdem[index], novaOrdem[alvo]] = [novaOrdem[alvo], novaOrdem[index]];
    await reordenar({ data: { dimensaoId: dimensao.id, ordem: novaOrdem.map((p) => p.id) } });
    queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
  }

  async function confirmarExclusao() {
    if (!excluirId) return;
    try {
      await excluir({ data: { id: excluirId } });
      toast.success("Pergunta excluída.");
      queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
    } catch (e) {
      toast.error("Erro ao excluir pergunta.");
    } finally {
      setExcluirId(null);
    }
  }

  if (dimensoes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Crie uma dimensão antes de adicionar perguntas.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label>Dimensão:</Label>
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={dimensaoAtiva}
            onChange={(e) => {
              setDimensaoAtiva(e.target.value);
              abrirNova();
            }}
          >
            {dimensoes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.titulo}
              </option>
            ))}
          </select>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={abrirNova} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nova pergunta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar pergunta" : "Nova pergunta"}</DialogTitle>
            </DialogHeader>
            <PerguntaFormUI form={form} onSubmit={onSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {perguntas.map((perg, index) => (
          <Card key={perg.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{perg.texto}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {perg.opcoes.map((o) => (
                    <Badge key={o.id} variant="outline">
                      {o.texto} (peso {o.peso})
                    </Badge>
                  ))}
                </div>
                {!perg.obrigatoria && <p className="mt-1 text-xs text-muted-foreground">Opcional</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => mover(index, -1)} disabled={index === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => mover(index, 1)} disabled={index === perguntas.length - 1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => abrirEdicao(perg)}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setExcluirId(perg.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!excluirId} onOpenChange={() => setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExcluirId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PerguntaFormUI({ form, onSubmit }: { form: ReturnType<typeof useForm<PerguntaForm>>; onSubmit: (values: PerguntaForm) => void }) {
  const opcoes = form.watch("opcoes") || [];

  const LETRAS = "ABCDEFGHIJ";

  function novaOpcao(index: number) {
    return { texto: "", peso: 0, letra: LETRAS[index] ?? "", ramo: null, rotulo: "", rotuloDescricao: "" };
  }

  function adicionarOpcao() {
    form.setValue("opcoes", [...opcoes, novaOpcao(opcoes.length)]);
  }

  function removerOpcao(index: number) {
    const novas = opcoes.filter((_, i) => i !== index);
    form.setValue("opcoes", novas.length ? novas : [novaOpcao(0)]);
  }

  function atualizarOpcao(
    index: number,
    campo: "texto" | "peso" | "letra" | "ramo" | "rotulo" | "rotuloDescricao",
    valor: string | number | null,
  ) {
    const novas = [...opcoes];
    novas[index] = { ...novas[index], [campo]: valor };
    form.setValue("opcoes", novas);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div>
        <Label htmlFor="texto">Texto da pergunta</Label>
        <Textarea id="texto" rows={3} {...form.register("texto")} />
      </div>
      <div className="flex items-center gap-3">
        <Switch id="obrigatoria" checked={form.watch("obrigatoria")} onCheckedChange={(v) => form.setValue("obrigatoria", v)} />
        <Label htmlFor="obrigatoria">Obrigatória</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="ramifica" checked={form.watch("ramifica")} onCheckedChange={(v) => form.setValue("ramifica", v)} />
        <Label htmlFor="ramifica">Pergunta que define a trilha (ramificação)</Label>
      </div>
      {form.watch("ramifica") && (
        <p className="text-xs text-muted-foreground">
          Defina em cada opção qual trilha ela ativa (individual ou casal).
        </p>
      )}
      <div className="space-y-3">
        <Label>Opções de resposta</Label>
        {opcoes.map((opc, index) => (
          <div key={index} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-start gap-2">
              <Input
                placeholder="Letra"
                value={opc.letra ?? ""}
                onChange={(e) => atualizarOpcao(index, "letra", e.target.value.toUpperCase())}
                className="w-16"
                maxLength={2}
              />
              <Input
                placeholder="Texto da opção"
                value={opc.texto}
                onChange={(e) => atualizarOpcao(index, "texto", e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                max={1000}
                placeholder="Peso"
                value={opc.peso}
                onChange={(e) => atualizarOpcao(index, "peso", Number(e.target.value))}
                className="w-24"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removerOpcao(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {form.watch("ramifica") && (
              <select
                value={opc.ramo ?? ""}
                onChange={(e) => atualizarOpcao(index, "ramo", e.target.value || null)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Não define trilha</option>
                <option value="solteiro">Ativa trilha individual</option>
                <option value="casal">Ativa trilha para casais</option>
              </select>
            )}
            <Input
              placeholder="Rótulo comportamental (opcional)"
              value={opc.rotulo ?? ""}
              onChange={(e) => atualizarOpcao(index, "rotulo", e.target.value)}
            />
            <Textarea
              rows={2}
              placeholder="Descrição do rótulo (opcional)"
              value={opc.rotuloDescricao ?? ""}
              onChange={(e) => atualizarOpcao(index, "rotuloDescricao", e.target.value)}
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={adicionarOpcao} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar opção
        </Button>
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        Salvar pergunta
      </Button>
    </form>
  );
}

/* ─── PERFIS ─── */
const perfilSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().min(2).max(120),
  descricao: z.string().max(6000).optional(),
  faixaMin: z.coerce.number().min(0).max(100),
  faixaMax: z.coerce.number().min(0).max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  regras: z.array(z.object({ pergunta: z.number().int().min(1), opcoes: z.array(z.string().max(4)) })),
  modoAtivacao: z.enum(["faixa", "regras", "hibrido", "dimensao"]),
  dimensaoId: z.string().uuid().nullable().optional(),
  minRegras: z.coerce.number().min(1).max(50),

  ramo: z.enum(["comum", "solteiro", "casal"]),
  ctaTexto: z.string().max(160).optional(),
  ctaUrl: z.string().max(500).optional(),
});

type PerfilForm = z.infer<typeof perfilSchema>;

const PERFIL_PADRAO: PerfilForm = {
  titulo: "",
  descricao: "",
  faixaMin: 0,
  faixaMax: 100,
  cor: "#d0b266",
  regras: [],
  modoAtivacao: "hibrido",
  dimensaoId: null,
  minRegras: 1,
  ramo: "comum",
  ctaTexto: "",
  ctaUrl: "",
};

function PerfisTab({ id, perfis, dimensoes }: { id: string; perfis: PerfilResultado[]; dimensoes: DimensaoCompleta[] }) {
  const salvar = useServerFn(salvarPerfilResultado);
  const excluir = useServerFn(excluirPerfilResultado);
  const reordenar = useServerFn(reordenarPerfis);
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<PerfilForm | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  const form = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: PERFIL_PADRAO,
  });

  function abrirNova() {
    setEditando(null);
    form.reset(PERFIL_PADRAO);
  }

  function abrirEdicao(perfil: PerfilResultado) {
    const valores: PerfilForm = {
      id: perfil.id,
      titulo: perfil.titulo,
      descricao: perfil.descricao || "",
      faixaMin: perfil.faixaMin,
      faixaMax: perfil.faixaMax,
      cor: perfil.cor,
      regras: perfil.regras ?? [],
      modoAtivacao: perfil.modoAtivacao ?? "hibrido",
      dimensaoId: perfil.dimensaoId ?? null,
      minRegras: perfil.minRegras || 1,
      ramo: perfil.ramo ?? "comum",
      ctaTexto: perfil.ctaTexto || "",
      ctaUrl: perfil.ctaUrl || "",
    };
    setEditando(valores);
    form.reset(valores);
  }

  async function onSubmit(values: PerfilForm) {
    try {
      await salvar({
        data: {
          id: values.id,
          diagnosticoId: id,
          titulo: values.titulo,
          descricao: values.descricao || undefined,
          faixaMin: values.faixaMin,
          faixaMax: values.faixaMax,
          cor: values.cor,
          regras: values.regras,
          modoAtivacao: values.modoAtivacao,
          dimensaoId: values.dimensaoId ?? null,
          minRegras: values.minRegras,
          ramo: values.ramo,
          ctaTexto: values.ctaTexto || undefined,
          ctaUrl: values.ctaUrl || undefined,
          ordem: editando ? perfis.find((p) => p.id === values.id)?.ordem ?? 0 : perfis.length,
        },
      });
      toast.success(values.id ? "Perfil atualizado." : "Perfil criado.");
      setEditando(null);
      abrirNova();
      queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar perfil.");
    }
  }

  async function mover(index: number, direcao: -1 | 1) {
    const novaOrdem = [...perfis];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= novaOrdem.length) return;
    [novaOrdem[index], novaOrdem[alvo]] = [novaOrdem[alvo], novaOrdem[index]];
    await reordenar({ data: { diagnosticoId: id, ordem: novaOrdem.map((p) => p.id) } });
    queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
  }

  async function confirmarExclusao() {
    if (!excluirId) return;
    try {
      await excluir({ data: { id: excluirId } });
      toast.success("Perfil excluído.");
      queryClient.invalidateQueries({ queryKey: ["diagnostico", id] });
    } catch (e) {
      toast.error("Erro ao excluir perfil.");
    } finally {
      setExcluirId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Defina as faixas de score e o perfil correspondente para cada intervalo.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={abrirNova} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editando ? "Editar perfil" : "Novo perfil"}</DialogTitle>
            </DialogHeader>
            <PerfilFormUI form={form} onSubmit={onSubmit} dimensoes={dimensoes} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {perfis.map((perfil, index) => (
          <Card key={perfil.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ background: perfil.cor }} />
                <div className="min-w-0">
                  <h3 className="font-medium">{perfil.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    Faixa: {perfil.faixaMin}% — {perfil.faixaMax}%
                  </p>
                  <p className="text-sm text-muted-foreground">{perfil.descricao}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => mover(index, -1)} disabled={index === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => mover(index, 1)} disabled={index === perfis.length - 1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => abrirEdicao(perfil)}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setExcluirId(perfil.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!excluirId} onOpenChange={() => setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExcluirId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PerfilFormUI({
  form,
  onSubmit,
  dimensoes,
}: {
  form: ReturnType<typeof useForm<PerfilForm>>;
  onSubmit: (values: PerfilForm) => void;
  dimensoes: DimensaoCompleta[];
}) {
  const regras = (form.watch("regras") ?? []) as RegraPerfil[];
  const modo = form.watch("modoAtivacao");
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div>
        <Label htmlFor="titulo">Título do perfil</Label>
        <Input id="titulo" {...form.register("titulo")} />
      </div>
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" rows={6} {...form.register("descricao")} />
      </div>
      <div>
        <Label htmlFor="modoAtivacao">Como este perfil é ativado</Label>
        <select
          id="modoAtivacao"
          {...form.register("modoAtivacao")}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="hibrido">Híbrido — regras E faixa de pontuação</option>
          <option value="regras">Só pelas regras de resposta</option>
          <option value="faixa">Só pela faixa de pontuação</option>
          <option value="dimensao">Pelo bloco de maior pontuação</option>
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          No modo híbrido o perfil só é atribuído se as regras baterem e o score cair dentro da faixa — é o que
          amarra o perfil aos pesos das perguntas. No modo por bloco, vence o perfil ligado ao bloco com maior
          percentual de pontuação.
        </p>
      </div>
      {modo === "dimensao" && (
        <div>
          <Label htmlFor="dimensaoId">Bloco vinculado a este perfil</Label>
          <select
            id="dimensaoId"
            {...form.register("dimensaoId")}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">Selecione um bloco…</option>
            {dimensoes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.titulo}
              </option>
            ))}
          </select>
        </div>
      )}
      {modo !== "faixa" && modo !== "dimensao" && (
        <div>
          <Label>Regras de ativação</Label>
          <RegrasEditor
            dimensoes={dimensoes}
            regras={regras}
            onChange={(novas: RegraPerfil[]) => form.setValue("regras", novas, { shouldDirty: true })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minRegras">Mínimo de regras atendidas</Label>
          <Input id="minRegras" type="number" min={1} max={50} {...form.register("minRegras")} />
        </div>
        <div>
          <Label htmlFor="perfilRamo">Trilha do perfil</Label>
          <select
            id="perfilRamo"
            {...form.register("ramo")}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="comum">Todas as trilhas</option>
            <option value="solteiro">Só trilha individual</option>
            <option value="casal">Só trilha para casais</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ctaTexto">Texto do CTA</Label>
          <Input id="ctaTexto" {...form.register("ctaTexto")} />
        </div>
        <div>
          <Label htmlFor="ctaUrl">Link do CTA</Label>
          <Input id="ctaUrl" {...form.register("ctaUrl")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min">Faixa mínima (%)</Label>
          <Input id="min" type="number" min={0} max={100} {...form.register("faixaMin")} />
        </div>
        <div>
          <Label htmlFor="max">Faixa máxima (%)</Label>
          <Input id="max" type="number" min={0} max={100} {...form.register("faixaMax")} />
        </div>
      </div>
      <div>
        <Label htmlFor="cor">Cor</Label>
        <div className="flex items-center gap-3">
          <Input id="cor" {...form.register("cor")} className="w-32" />
          <div className="h-8 w-8 rounded-full border border-border" style={{ background: form.watch("cor") }} />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        Salvar perfil
      </Button>
    </form>
  );
}

/* ─── PREVIEW ─── */
function PreviewTab({ id, dimensoes, perfis }: { id: string; dimensoes: DimensaoCompleta[]; perfis: PerfilResultado[] }) {
  const calcularFn = useServerFn(calcularScorePreview);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<Awaited<ReturnType<typeof calcularScorePreview>> | null>(null);
  const [carregando, setCarregando] = useState(false);

  const todasPerguntas = dimensoes.flatMap((d) => d.perguntas);

  async function calcularResultado() {
    setCarregando(true);
    try {
      const r = await calcularFn({ data: { diagnosticoId: id, respostas } });
      setResultado(r);
    } catch (e) {
      toast.error("Erro ao calcular resultado.");
    } finally {
      setCarregando(false);
    }
  }


  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Preview do respondente</CardTitle>
        </CardHeader>
        <div className="space-y-8">
          {todasPerguntas.map((perg) => (
            <div key={perg.id}>
              <p className="mb-3 font-medium">
                {perg.texto}
                {perg.obrigatoria && <span className="text-destructive"> *</span>}
              </p>
              <RadioGroup
                value={respostas[perg.id] || ""}
                onValueChange={(val) => setRespostas((prev) => ({ ...prev, [perg.id]: val }))}
              >
                {perg.opcoes.map((opc) => (
                  <div key={opc.id} className="flex items-center gap-2 py-1">
                    <RadioGroupItem value={opc.id} id={opc.id} />
                    <Label htmlFor={opc.id} className="font-normal">
                      {opc.texto}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
        <Button
          onClick={calcularResultado}
          disabled={carregando}

          className="mt-8 w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {carregando ? "Calculando..." : "Calcular resultado"}
        </Button>
      </Card>

      {resultado && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl">Resultado calculado</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-lg">
              Score: <strong>{resultado.scorePercentual}%</strong>{" "}
              <span className="text-sm text-muted-foreground">
                ({resultado.score} de {resultado.scoreMaximo} pontos)
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Trilha: {resultado.ramo === "casal" ? "Casal" : resultado.ramo === "solteiro" ? "Individual" : "Comum"}
              </Badge>
              {resultado.criterio && (
                <Badge variant="outline">
                  Perfil ativado por {resultado.criterio === "regras" ? "regras de resposta" : "faixa de pontuação"}
                </Badge>
              )}
            </div>
            {resultado.dimensoes.length > 0 && (
              <div className="space-y-1 rounded-md border border-border p-3">
                {resultado.dimensoes.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.titulo}</span>
                    <span className="font-medium">
                      {d.scorePercentual}% ({d.score}/{d.scoreMaximo})
                    </span>
                  </div>
                ))}
              </div>
            )}
            {resultado.perfil ? (
              <div className="rounded-lg border p-4" style={{ borderColor: resultado.perfil.cor }}>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full" style={{ background: resultado.perfil.cor }} />
                  <h3 className="text-lg font-semibold">{resultado.perfil.titulo}</h3>
                </div>
                <p className="mt-2 text-muted-foreground">{resultado.perfil.descricao}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum perfil encontrado para esta combinação.</p>
            )}
          </div>

        </Card>
      )}
    </div>
  );
}
