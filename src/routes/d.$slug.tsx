import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { DiagnosticoPublico, DimensaoPublica, Ramo } from "@/lib/respostas.functions";
import { enviarResposta, obterDiagnosticoPublico } from "@/lib/respostas.functions";
import { registrarMarcoSessao } from "@/lib/sessoes.functions";
import { cpfValido, formatarCpf } from "@/lib/cpf";

export const Route = createFileRoute("/d/$slug")({
  loader: async ({ params }): Promise<DiagnosticoPublico | null> =>
    obterDiagnosticoPublico({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const titulo = loaderData?.titulo ?? "Diagnóstico Financeiro";
    const descricao =
      loaderData?.descricao ??
      "Responda o diagnóstico financeiro comportamental e receba seu perfil com leitura personalizada.";
    return {
      meta: [
        { title: `${titulo} | Cibele Lucena` },
        { name: "description", content: descricao.slice(0, 155) },
        { property: "og:title", content: `${titulo} | Cibele Lucena` },
        { property: "og:description", content: descricao.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DiagnosticoPublicoPage,
});

type Etapa = "capa" | "dados" | number;

function formatarWhatsapp(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function DiagnosticoPublicoPage() {
  const diagnostico: DiagnosticoPublico | null = Route.useLoaderData();
  const navigate = useNavigate();
  const enviar = useServerFn(enviarResposta);

  const [etapa, setEtapa] = useState<Etapa>("capa");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappTocado, setWhatsappTocado] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cpfTocado, setCpfTocado] = useState(false);
  const [renda, setRenda] = useState("");
  const [cargo, setCargo] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [direcao, setDirecao] = useState<"frente" | "tras">("frente");
  const [saindo, setSaindo] = useState(false);


  const escolhasRef = useRef<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // medição do funil: abertura, início, coleta de dados e conclusão
  const slug = diagnostico?.slug ?? null;
  const marcosRef = useRef<Set<string>>(new Set());
  const marcar = useMemo(
    () =>
      (marco: "aberto" | "iniciado" | "dados" | "concluido", respostaId?: string) => {
        if (!slug || typeof window === "undefined") return;
        if (marcosRef.current.has(marco)) return;
        marcosRef.current.add(marco);
        let sessaoKey = window.sessionStorage.getItem(`diag-sessao:${slug}`);
        if (!sessaoKey) {
          sessaoKey = crypto.randomUUID();
          window.sessionStorage.setItem(`diag-sessao:${slug}`, sessaoKey);
        }
        void registrarMarcoSessao({
          data: {
            slug,
            sessaoKey,
            marco,
            ...(respostaId ? { respostaId } : {}),
            ...(window.location.search ? { origem: window.location.search.slice(0, 200) } : {}),
          },
        }).catch(() => {});
      },
    [slug],
  );

  useEffect(() => {
    marcar("aberto");
  }, [marcar]);

  const todasDimensoes = diagnostico?.dimensoes ?? [];
  const blocosComuns = useMemo(
    () => todasDimensoes.filter((d) => d.ramo === "comum"),
    [todasDimensoes],
  );

  // ramo definido pela pergunta de ramificação (última do bloco comum)
  const ramoAtual: Ramo | null = useMemo(() => {
    for (const dim of blocosComuns) {
      for (const perg of dim.perguntas) {
        if (!perg.ramifica) continue;
        const opcao = perg.opcoes.find((o) => o.id === escolhas[perg.id]);
        if (opcao?.ramo && opcao.ramo !== "comum") return opcao.ramo;
      }
    }
    return null;
  }, [blocosComuns, escolhas]);

  const passos: DimensaoPublica[] = useMemo(() => {
    const blocosRamo = ramoAtual ? todasDimensoes.filter((d) => d.ramo === ramoAtual) : [];
    return [...blocosComuns, ...blocosRamo];
  }, [blocosComuns, ramoAtual, todasDimensoes]);

  // lista achatada: uma pergunta por tela, guardando a dimensão de origem
  const perguntasFluxo = useMemo(
    () =>
      passos.flatMap((dim) =>
        dim.perguntas.map((pergunta) => ({ pergunta, dimensao: dim })),
      ),
    [passos],
  );

  const totalPerguntasCaminho = perguntasFluxo.length;
  const perguntasVisiveis = useMemo(
    () => new Set(perguntasFluxo.map((i) => i.pergunta.id)),
    [perguntasFluxo],
  );

  const whatsappDigitos = whatsapp.replace(/\D/g, "");
  const whatsappValido = whatsappDigitos.length >= 10 && whatsappDigitos.length <= 11;
  const cpfOk = cpfValido(cpf);

  // rede de segurança: se o índice passar do fim do fluxo, vai para a coleta de dados
  const submeterRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (typeof etapa !== "number") return;
    if (perguntasFluxo.length > 0 && etapa >= perguntasFluxo.length && !enviando) {
      setEtapa("dados");
    }
  }, [etapa, perguntasFluxo.length, enviando]);

  useEffect(() => {
    if (etapa === "dados") marcar("dados");
  }, [etapa, marcar]);


  if (!diagnostico || blocosComuns.length === 0) {
    return (
      <main className="theme-painel flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold uppercase">Diagnóstico indisponível</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Este diagnóstico não existe ou ainda não foi publicado. Verifique o link recebido.
          </p>
        </div>
      </main>
    );
  }

  const indiceAtual = typeof etapa === "number" ? etapa : -1;
  const itemAtual = indiceAtual >= 0 ? perguntasFluxo[indiceAtual] : null;
  const respondidaAtual = itemAtual ? Boolean(escolhas[itemAtual.pergunta.id]) : false;

  function irPara(indice: number, dir: "frente" | "tras") {
    if (saindo) return;
    setDirecao(dir);
    setSaindo(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setEtapa(indice);
      setSaindo(false);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }, 220);
  }

  function avancar(indice: number) {
    irPara(indice, indice < indiceAtual ? "tras" : "frente");
  }

  function finalizar() {
    if (saindo) return;
    setDirecao("frente");
    setSaindo(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setEtapa("dados");
      setSaindo(false);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }, 220);
  }

  function responder(perguntaId: string, opcaoId: string, ramifica: boolean) {
    if (saindo || enviando) return;
    marcar("iniciado");
    const perguntaAtual = itemAtual?.pergunta;
    const opcaoEscolhida = perguntaAtual?.opcoes.find((o) => o.id === opcaoId);

    setEscolhas((prev) => {
      const proximo = { ...prev, [perguntaId]: opcaoId };
      if (ramifica) {
        // ao trocar a ramificação, limpa as respostas dos blocos exclusivos do outro caminho
        for (const dim of todasDimensoes) {
          if (dim.ramo === "comum") continue;
          for (const perg of dim.perguntas) delete proximo[perg.id];
        }
      }
      escolhasRef.current = proximo;
      return proximo;
    });


    const indice = indiceAtual;
    if (indice < 0) return;

    if (ramifica) {
      // o ramo escolhido pode acrescentar novos blocos; se não houver, finaliza
      const ramoEscolhido = opcaoEscolhida?.ramo && opcaoEscolhida.ramo !== "comum" ? opcaoEscolhida.ramo : null;
      const perguntasDoRamo = ramoEscolhido
        ? todasDimensoes
            .filter((d) => d.ramo === ramoEscolhido)
            .reduce((acc, d) => acc + d.perguntas.length, 0)
        : 0;
      if (indice < perguntasFluxo.length - 1 || perguntasDoRamo > 0) {
        irPara(indice + 1, "frente");
      } else {
        finalizar();
      }
      return;
    }

    // última pergunta do fluxo → envia; senão avança
    if (indice < perguntasFluxo.length - 1) {
      irPara(indice + 1, "frente");
    } else {
      finalizar();
    }
  }

  submeterRef.current = () => void submeter();
  escolhasRef.current = escolhas;

  async function submeter() {
    setEnviando(true);
    try {
      // usa a referência mais recente: o clique da última pergunta ainda pode não ter renderizado
      const atuais = escolhasRef.current;
      const respostas = Object.entries(atuais)
        .filter(([perguntaId]) => perguntasVisiveis.has(perguntaId))
        .map(([perguntaId, opcaoId]) => ({ perguntaId, opcaoId }));

      const { respostaId } = await enviar({
        data: {
          slug: diagnostico!.slug,
          nome,
          email,
          whatsapp,
          cpf,
          renda: renda || undefined,
          cargo: cargo || undefined,
          estadoCivil: estadoCivil || undefined,
          consentimento: true,
          respostas,
        },
      });
      marcar("concluido", respostaId);
      navigate({ to: "/d/$slug/r/$respostaId", params: { slug: diagnostico!.slug, respostaId } });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar suas respostas.");
      setEnviando(false);
    }
  }

  const ultimaPergunta = indiceAtual >= 0 && indiceAtual === perguntasFluxo.length - 1;
  const progresso =
    totalPerguntasCaminho > 0 && indiceAtual >= 0
      ? Math.round(((indiceAtual + (respondidaAtual ? 1 : 0)) / totalPerguntasCaminho) * 100)
      : 0;

  return (
    <main className="theme-painel min-h-screen bg-background px-5 py-10 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Cibele Lucena · Diagnóstico</p>

        {etapa === "capa" && (
          <section className="mt-6">
            <h1 className="text-3xl font-semibold uppercase leading-tight md:text-4xl">{diagnostico.titulo}</h1>
            {diagnostico.descricao && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{diagnostico.descricao}</p>
            )}
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {(diagnostico.capaItens
                ?.split("\n")
                .map((linha) => linha.replace(/^[·•-]\s*/, "").trim())
                .filter(Boolean).length
                ? diagnostico
                    .capaItens!.split("\n")
                    .map((linha) => linha.replace(/^[·•-]\s*/, "").trim())
                    .filter(Boolean)
                : [
                    `${diagnostico.totalPerguntas} perguntas objetivas`,
                    "Uma pergunta por vez, com opção de voltar",
                    `Cerca de ${Math.max(2, Math.round(diagnostico.totalPerguntas * 0.4))} minutos`,
                  ]
              ).map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <Button className="mt-8" size="lg" onClick={() => setEtapa(0)}>
              Começar diagnóstico
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </section>
        )}

        {etapa === "dados" && (
          <section className="mt-6">
            <Progress value={100} className="h-1.5" />
            <h2 className="mt-6 text-2xl font-semibold uppercase">Suas respostas foram registradas</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Falta só um passo: precisamos dos seus dados para enviar o resultado completo por e-mail e para nosso
              time agendar sua devolutiva.
            </p>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp (com DDD) *</Label>
                <Input
                  id="whatsapp"
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatarWhatsapp(e.target.value))}
                  onBlur={() => setWhatsappTocado(true)}
                  aria-invalid={whatsappTocado && !whatsappValido}
                  aria-describedby="whatsapp-erro"
                  maxLength={16}
                />
                {whatsappTocado && !whatsappValido && (
                  <p id="whatsapp-erro" className="text-xs text-destructive">
                    Informe um WhatsApp válido com DDD (10 ou 11 dígitos).
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCpf(e.target.value))}
                  onBlur={() => setCpfTocado(true)}
                  aria-invalid={cpfTocado && !cpfOk}
                  aria-describedby="cpf-erro"
                  maxLength={14}
                />
                {cpfTocado && !cpfOk && (
                  <p id="cpf-erro" className="text-xs text-destructive">
                    Informe um CPF válido.
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Profissão / cargo (opcional)</Label>
                  <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estadoCivil">Estado civil (opcional)</Label>
                  <select
                    id="estadoCivil"
                    value={estadoCivil}
                    onChange={(e) => setEstadoCivil(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">Selecione</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a) / união estável</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="renda">Faixa de renda mensal (opcional)</Label>
                <select
                  id="renda"
                  value={renda}
                  onChange={(e) => setRenda(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="">Selecione</option>
                  <option value="ate-5k">Até R$ 5 mil</option>
                  <option value="5k-10k">R$ 5 mil a R$ 10 mil</option>
                  <option value="10k-20k">R$ 10 mil a R$ 20 mil</option>
                  <option value="20k-50k">R$ 20 mil a R$ 50 mil</option>
                  <option value="acima-50k">Acima de R$ 50 mil</option>
                </select>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
                <Checkbox
                  id="consentimento"
                  checked={consentimento}
                  onCheckedChange={(v) => setConsentimento(v === true)}
                />
                <Label htmlFor="consentimento" className="text-xs font-normal leading-relaxed text-muted-foreground">
                  Autorizo o contato e o tratamento dos meus dados para fins deste diagnóstico, conforme a LGPD.
                </Label>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <Button
                variant="ghost"
                disabled={enviando}
                onClick={() => setEtapa(Math.max(0, perguntasFluxo.length - 1))}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Voltar
              </Button>
              <Button
                disabled={
                  enviando ||
                  nome.trim().length < 2 ||
                  !/^\S+@\S+\.\S+$/.test(email.trim()) ||
                  !whatsappValido ||
                  !cpfOk ||
                  !consentimento
                }
                onClick={() => void submeter()}
              >
                {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {enviando ? "Calculando seu resultado..." : "Ver meu resultado"}
                {!enviando && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>
          </section>
        )}

        {!itemAtual && typeof etapa === "number" && (
          <section className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Calculando seu resultado...
          </section>
        )}

        {itemAtual && (
          <section className="mt-6">
            <Progress value={progresso} className="h-1.5" />
            <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Pergunta {indiceAtual + 1} de {totalPerguntasCaminho} · {itemAtual.dimensao.titulo}
            </p>

            <div
              key={itemAtual.pergunta.id}
              className={`mt-4 rounded-lg border border-border bg-card p-5 ${
                saindo
                  ? direcao === "frente"
                    ? "q-out-up"
                    : "q-out-down"
                  : direcao === "frente"
                    ? "q-in-up"
                    : "q-in-down"
              }`}
            >
              <h2 className="text-xl font-medium leading-snug">{itemAtual.pergunta.texto}</h2>
              {(() => {
                const opcoes = itemAtual.pergunta.opcoes;
                const escala =
                  opcoes.length > 3 && opcoes.every((o) => /^\d{1,2}$/.test(o.texto.trim()));

                if (escala) {
                  return (
                    <div className="mt-5">
                      <div className="flex flex-wrap gap-2">
                        {opcoes.map((opcao) => {
                          const selecionada = escolhas[itemAtual.pergunta.id] === opcao.id;
                          return (
                            <button
                              key={opcao.id}
                              type="button"
                              disabled={enviando}
                              onClick={() =>
                                responder(itemAtual.pergunta.id, opcao.id, itemAtual.pergunta.ramifica)
                              }
                              className={`h-12 min-w-12 flex-1 rounded-md border text-base font-medium transition-colors ${
                                selecionada
                                  ? "border-accent bg-accent/15 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-accent/60 hover:text-foreground"
                              }`}
                              aria-pressed={selecionada}
                            >
                              {opcao.texto.trim()}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                        <span>Discordo totalmente</span>
                        <span>Concordo totalmente</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="mt-5 space-y-2">
                    {opcoes.map((opcao) => {
                      const selecionada = escolhas[itemAtual.pergunta.id] === opcao.id;
                      return (
                        <button
                          key={opcao.id}
                          type="button"
                          disabled={enviando}
                          onClick={() =>
                            responder(itemAtual.pergunta.id, opcao.id, itemAtual.pergunta.ramifica)
                          }
                          className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                            selecionada
                              ? "border-accent bg-accent/15 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-accent/60 hover:text-foreground"
                          }`}
                          aria-pressed={selecionada}
                        >
                          {opcao.letra && !itemAtual.pergunta.ramifica && (
                            <span className="mr-2 font-semibold text-accent">{opcao.letra})</span>
                          )}
                          {opcao.texto}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="ghost"
                disabled={enviando}
                onClick={() => (indiceAtual === 0 ? setEtapa("capa") : avancar(indiceAtual - 1))}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Voltar
              </Button>
              {respondidaAtual &&
                (ultimaPergunta ? (
                  <Button disabled={enviando} onClick={() => finalizar()}>
                    Finalizar
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button disabled={enviando} onClick={() => avancar(indiceAtual + 1)}>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
