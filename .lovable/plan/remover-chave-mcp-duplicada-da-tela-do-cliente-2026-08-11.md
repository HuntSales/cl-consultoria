# Remover chave MCP duplicada da tela do cliente

## Objetivo

Eliminar o campo de chave MCP específica por cliente da tela de detalhe do cliente (`/painel/gestao/$clienteId`), mantendo a chave/token MCP apenas na área de configurações do agente (`/painel/gestao/configuracoes`).

## Alterações

### 1. Tela de detalhe do cliente

- Remover a seção "Chave MCP do MyMoney" de `src/routes/_authenticated/painel/gestao.$clienteId.tsx`.
- Remover o import de `salvarChaveMcpCliente`.
- Remover o estado local `chaveMcp` e o `useServerFn(salvarChaveMcpCliente)`.
- Ajustar os imports de ícones (remover `Link2` se não for mais usado).

### 2. Funções de gestão

Em `src/lib/gestao.functions.ts`:

- Remover a função `salvarChaveMcpCliente`.
- Remover `mcp_cliente_cifrado` das queries de `listarClientesGestao` e `obterClienteGestao`.
- Remover o campo `temMcpCliente` do tipo `ClienteGestao` e dos retornos mapeados.
- No agente (`perguntarAgente`), usar apenas o token MCP do consultor (`config.mcp_token_cifrado`), removendo o fallback para a chave específica do cliente.

### 3. Lista de clientes

Em `src/routes/_authenticated/painel/gestao.index.tsx`:

- Remover o status "MyMoney vinculado / não vinculado" dos cards, que hoje depende de `temMcpCliente`.
- Remover o import de `CheckCircle2` se não for mais usado.

### 4. Tela de configurações

Em `src/routes/_authenticated/painel/gestao.configuracoes.tsx`:

- Atualizar o texto auxiliar do campo "Token padrão" para remover a menção de que "cada cliente pode ter a própria chave MCP".
- O campo continua como token MCP padrão da consultora.

## Notas

- A coluna `mcp_cliente_cifrado` em `clientes_gestao` ficará sem uso, mas não será removida nesta mudança (evita migração de schema).
- O token MCP do consultor, salvo em `consultor_ai_config`, continua sendo usado pelo agente.
