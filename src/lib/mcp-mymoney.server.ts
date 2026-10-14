/** Cliente MCP mínimo (Streamable HTTP + JSON-RPC) para o sistema MyMoney. */

export type McpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

type JsonRpcResposta = { result?: unknown; error?: { message?: string } };

async function chamarRpc(
  url: string,
  token: string | null,
  metodo: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: metodo, params }),
  });

  const bruto = await resposta.text();
  if (!resposta.ok) {
    throw new Error(`MCP MyMoney respondeu ${resposta.status}: ${bruto.slice(0, 300)}`);
  }

  let corpo = bruto.trim();
  if (corpo.startsWith("event:") || corpo.startsWith("data:")) {
    const linhas = corpo
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim());
    corpo = linhas[linhas.length - 1] ?? "";
  }

  let json: JsonRpcResposta;
  try {
    json = JSON.parse(corpo) as JsonRpcResposta;
  } catch {
    throw new Error("Resposta inválida do MCP MyMoney.");
  }
  if (json.error) throw new Error(json.error.message ?? "Erro no MCP MyMoney.");
  return json.result;
}

export async function listarFerramentasMcp(url: string, token: string | null): Promise<McpTool[]> {
  const resultado = (await chamarRpc(url, token, "tools/list", {})) as { tools?: McpTool[] } | undefined;
  return resultado?.tools ?? [];
}

export async function executarFerramentaMcp(
  url: string,
  token: string | null,
  nome: string,
  argumentos: Record<string, unknown>,
): Promise<string> {
  const resultado = (await chamarRpc(url, token, "tools/call", { name: nome, arguments: argumentos })) as
    | { content?: { type: string; text?: string }[]; structuredContent?: unknown }
    | undefined;
  const textos = (resultado?.content ?? [])
    .map((c) => (c.type === "text" ? c.text ?? "" : ""))
    .filter(Boolean)
    .join("\n");
  if (textos) return textos.slice(0, 20000);
  return JSON.stringify(resultado?.structuredContent ?? resultado ?? {}).slice(0, 20000);
}
