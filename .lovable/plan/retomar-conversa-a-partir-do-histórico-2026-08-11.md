# Retomar conversa a partir do histórico

## O que muda

Na linha do tempo de insights (tela do cliente), cada histórico ganha um botão **Retomar conversa**:

- Ao clicar, as mensagens daquele histórico são carregadas na área de consulta, com um aviso "Continuando o histórico: <título>".
- O consultor continua perguntando normalmente; o agente recebe o contexto completo daquela conversa (perguntas e respostas anteriores) além do contexto do cliente (diagnósticos, CRM, MyMoney).
- Ao salvar, a conversa retomada **atualiza o mesmo item** do histórico (não cria duplicado): as novas mensagens são acrescentadas ao final, mantendo o título e a data original, com a data de atualização visível.
- Botão **Descartar** limpa a área e sai do modo retomada, sem alterar o histórico salvo.
- Se o consultor já tiver uma conversa em andamento não salva, um aviso pede para salvar ou descartar antes de retomar outra.

## Detalhes técnicos

- `salvarConversa` passa a aceitar `conversaId` opcional: quando presente, valida a posse, insere as novas mensagens continuando a numeração de `ordem` e atualiza `atualizado_em` da conversa; quando ausente, mantém o comportamento atual de criar nova conversa.
- Migração: coluna `atualizado_em timestamptz not null default now()` em `agente_conversas` (usada na ordenação da lista e na exibição).
- `listarConversas` passa a retornar `atualizadoEm` e ordena por ele.
- Em `gestao.$clienteId.tsx`: novo estado `conversaRetomadaId`; ao retomar, `obterConversa` popula `mensagens` e marca o id; o envio continua usando `perguntarAgente` com `historico` (limite ampliado das últimas 10 para as últimas 20 mensagens para preservar contexto da conversa retomada); ao salvar, só as mensagens novas são enviadas quando há `conversaId`.
