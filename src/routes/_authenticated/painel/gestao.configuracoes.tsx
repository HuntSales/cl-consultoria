import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { obterConfigAgente, salvarConfigAgente } from "@/lib/gestao.functions";
import {
  MODELOS_IA,
  OUTRO_MODELO,
  ehModeloConhecido,
  modeloRecomendado,
  type ProvedorIA,
} from "@/lib/modelos-ia";

export const Route = createFileRoute("/_authenticated/painel/gestao/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações do agente | Painel Cibele Lucena" },
      { name: "description", content: "Configure o provedor de IA, a chave de API e a conexão MCP do MyMoney." },
      { property: "og:title", content: "Configurações do agente | Painel Cibele Lucena" },
      { property: "og:description", content: "Provedor de IA, chave de API e conexão MCP do MyMoney." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfiguracoesAgentePage,
});

function ConfiguracoesAgentePage() {
  const obterFn = useServerFn(obterConfigAgente);
  const salvarFn = useServerFn(salvarConfigAgente);
  const config = useQuery({ queryKey: ["config-agente"], queryFn: () => obterFn({ data: {} as never }) });

  const [provedor, setProvedor] = useState<ProvedorIA>("openai");
  const [modelo, setModelo] = useState(() => modeloRecomendado("openai"));
  const [modeloCustom, setModeloCustom] = useState("");
  const [usarOutro, setUsarOutro] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpToken, setMcpToken] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!config.data) return;
    const prov = config.data.provedor;
    const salvo = config.data.modelo ?? "";
    setProvedor(prov);
    if (salvo && !ehModeloConhecido(prov, salvo)) {
      setUsarOutro(true);
      setModeloCustom(salvo);
      setModelo(OUTRO_MODELO);
    } else {
      setUsarOutro(false);
      setModeloCustom("");
      setModelo(salvo || modeloRecomendado(prov));
    }
    setMcpUrl(config.data.mcpUrl ?? "");
  }, [config.data]);

  function trocarProvedor(novo: ProvedorIA) {
    setProvedor(novo);
    setUsarOutro(false);
    setModeloCustom("");
    setModelo(modeloRecomendado(novo));
  }

  const modeloFinal = usarOutro ? modeloCustom.trim() : modelo;


  async function salvar() {
    setSalvando(true);
    try {
      await salvarFn({
        data: {
          provedor,
          modelo: modeloFinal || undefined,
          apiKey: apiKey.trim() || undefined,
          mcpUrl: mcpUrl.trim() || undefined,
          mcpToken: mcpToken.trim() || undefined,
        },
      });
      setApiKey("");
      setMcpToken("");
      await config.refetch();
      toast.success("Configurações salvas.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/painel/gestao">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold uppercase tracking-wide">Configurações do agente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A chave de API e o token do MyMoney são salvos criptografados e nunca voltam para a tela.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="space-y-2">
          <Label>Provedor de IA</Label>
          <Select value={provedor} onValueChange={(v) => trocarProvedor(v as ProvedorIA)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo">Modelo</Label>
          <Select
            value={modelo}
            onValueChange={(v) => {
              setModelo(v);
              setUsarOutro(v === OUTRO_MODELO);
            }}
          >
            <SelectTrigger id="modelo">
              <SelectValue placeholder="Selecione o modelo" />
            </SelectTrigger>
            <SelectContent>
              {MODELOS_IA[provedor].map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex flex-col text-left">
                    <span className="font-medium">
                      {m.rotulo}
                      {m.recomendado ? " · recomendado" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.descricao}</span>
                  </span>
                </SelectItem>
              ))}
              <SelectItem value={OUTRO_MODELO}>Outro (digitar manualmente)</SelectItem>
            </SelectContent>
          </Select>
          {usarOutro ? (
            <Input
              value={modeloCustom}
              placeholder={provedor === "openai" ? "gpt-4o" : "claude-sonnet-4-5"}
              onChange={(e) => setModeloCustom(e.target.value)}
            />
          ) : null}
        </div>


        <div className="space-y-2">
          <Label htmlFor="api-key">Chave de API {config.data?.temApiKey ? "(já configurada)" : "*"}</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            placeholder={provedor === "openai" ? "sk-..." : "sk-ant-..."}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider">MCP MyMoney</h2>
        <div className="space-y-2">
          <Label htmlFor="mcp-url">URL do servidor MCP</Label>
          <Input
            id="mcp-url"
            value={mcpUrl}
            placeholder="https://mymoney.exemplo.com/mcp"
            onChange={(e) => setMcpUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mcp-token">
            Token {config.data?.temMcpToken ? "(já configurado)" : "(opcional)"}
          </Label>
          <Input
            id="mcp-token"
            type="password"
            value={mcpToken}
            onChange={(e) => setMcpToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Token de acesso do MyMoney usado pelo agente para consultar a gestão financeira dos clientes.
          </p>
        </div>
      </section>

      <Button disabled={salvando} onClick={() => void salvar()}>
        {salvando ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        Salvar configurações
      </Button>
    </div>
  );
}
