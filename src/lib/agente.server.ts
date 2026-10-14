import { executarFerramentaMcp, listarFerramentasMcp, type McpTool } from "@/lib/mcp-mymoney.server";

export type Provedor = "openai" | "anthropic";

export type MensagemAgente = { papel: "user" | "assistant"; conteudo: string };

type Ferramentas = { url: string; token: string | null; lista: McpTool[] };

const MODELO_PADRAO: Record<Provedor, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-5",
};

async function carregarFerramentas(mcpUrl: string | null, mcpToken: string | null): Promise<Ferramentas | null> {
  if (!mcpUrl) return null;
  try {
    const lista = await listarFerramentasMcp(mcpUrl, mcpToken);
    return { url: mcpUrl, token: mcpToken, lista };
  } catch {
    return null;
  }
}

async function rodarOpenAI(
  apiKey: string,
  modelo: string,
  sistema: string,
  historico: MensagemAgente[],
  ferramentas: Ferramentas | null,
): Promise<string> {
  type Msg = Record<string, unknown>;
  const mensagens: Msg[] = [
    { role: "system", content: sistema },
    ...historico.map((m) => ({ role: m.papel === "user" ? "user" : "assistant", content: m.conteudo })),
  ];

  const tools = ferramentas?.lista.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description ?? t.name,
      parameters: t.inputSchema ?? { type: "object", properties: {} },
    },
  }));

  for (let passo = 0; passo < 6; passo += 1) {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelo,
        messages: mensagens,
        ...(tools && tools.length ? { tools } : {}),
      }),
    });
    const json = (await resposta.json()) as {
      error?: { message?: string };
      choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[];
    };
    if (!resposta.ok) throw new Error(json.error?.message ?? `Erro do provedor (${resposta.status}).`);

    const msg = json.choices?.[0]?.message;
    if (!msg) throw new Error("Resposta vazia do provedor.");

    if (msg.tool_calls?.length && ferramentas) {
      mensagens.push(msg as Msg);
      for (const chamada of msg.tool_calls) {
        let saida: string;
        try {
          const args = chamada.function.arguments ? (JSON.parse(chamada.function.arguments) as Record<string, unknown>) : {};
          saida = await executarFerramentaMcp(ferramentas.url, ferramentas.token, chamada.function.name, args);
        } catch (erro) {
          saida = `Erro ao executar ferramenta: ${erro instanceof Error ? erro.message : "desconhecido"}`;
        }
        mensagens.push({ role: "tool", tool_call_id: chamada.id, content: saida });
      }
      continue;
    }

    return msg.content ?? "";
  }
  return "Não foi possível concluir a análise (limite de etapas atingido).";
}

async function rodarAnthropic(
  apiKey: string,
  modelo: string,
  sistema: string,
  historico: MensagemAgente[],
  ferramentas: Ferramentas | null,
): Promise<string> {
  type Bloco = Record<string, unknown>;
  const mensagens: { role: "user" | "assistant"; content: unknown }[] = historico.map((m) => ({
    role: m.papel,
    content: m.conteudo,
  }));

  const tools = ferramentas?.lista.map((t) => ({
    name: t.name,
    description: t.description ?? t.name,
    input_schema: t.inputSchema ?? { type: "object", properties: {} },
  }));

  for (let passo = 0; passo < 6; passo += 1) {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 4000,
        system: sistema,
        messages: mensagens,
        ...(tools && tools.length ? { tools } : {}),
      }),
    });
    const json = (await resposta.json()) as {
      error?: { message?: string };
      content?: { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[];
      stop_reason?: string;
    };
    if (!resposta.ok) throw new Error(json.error?.message ?? `Erro do provedor (${resposta.status}).`);

    const blocos = json.content ?? [];
    const usos = blocos.filter((b) => b.type === "tool_use");

    if (usos.length && ferramentas) {
      mensagens.push({ role: "assistant", content: blocos as unknown as Bloco[] });
      const retornos: Bloco[] = [];
      for (const uso of usos) {
        let saida: string;
        try {
          saida = await executarFerramentaMcp(ferramentas.url, ferramentas.token, uso.name ?? "", uso.input ?? {});
        } catch (erro) {
          saida = `Erro ao executar ferramenta: ${erro instanceof Error ? erro.message : "desconhecido"}`;
        }
        retornos.push({ type: "tool_result", tool_use_id: uso.id, content: saida });
      }
      mensagens.push({ role: "user", content: retornos });
      continue;
    }

    return blocos
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n");
  }
  return "Não foi possível concluir a análise (limite de etapas atingido).";
}

export async function executarAgente(opcoes: {
  provedor: Provedor;
  apiKey: string;
  modelo: string | null;
  sistema: string;
  historico: MensagemAgente[];
  mcpUrl: string | null;
  mcpToken: string | null;
}): Promise<string> {
  const ferramentas = await carregarFerramentas(opcoes.mcpUrl, opcoes.mcpToken);
  const modelo = opcoes.modelo?.trim() || MODELO_PADRAO[opcoes.provedor];
  return opcoes.provedor === "anthropic"
    ? rodarAnthropic(opcoes.apiKey, modelo, opcoes.sistema, opcoes.historico, ferramentas)
    : rodarOpenAI(opcoes.apiKey, modelo, opcoes.sistema, opcoes.historico, ferramentas);
}
