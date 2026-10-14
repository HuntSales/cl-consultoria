# Escolha de modelo nas configurações do agente

Hoje não funciona assim: o campo "Modelo (opcional)" é um texto livre, com apenas um exemplo cinza (`gpt-4o` / `claude-sonnet-4-5`). Se ficar vazio, o sistema usa um modelo padrão. Ou seja, você precisa saber e digitar o nome exato do modelo.

## O que será feito

Trocar o campo de texto por uma **lista de seleção de modelos**, que muda conforme o provedor escolhido:

**OpenAI**
- GPT-5.6 Sol (recomendado)
- GPT-5.6 Terra (equilíbrio custo/qualidade)
- GPT-5.6 Luna (rápido e barato)
- GPT-5.5
- GPT-4o

**Anthropic**
- Claude Sonnet 4.5 (recomendado)
- Claude Opus 4.1
- Claude Haiku 4.5

Detalhes de comportamento:
- Ao trocar o provedor, a lista muda e o modelo volta para o recomendado daquele provedor.
- Cada item mostra um rótulo amigável e uma linha curta explicando quando usar.
- Opção final "Outro (digitar manualmente)", que revela o campo de texto atual — assim modelos novos continuam utilizáveis sem depender de atualização.
- O valor salvo continua sendo o identificador técnico do modelo, então nada muda no funcionamento do agente já existente.

## Técnico

- Novo arquivo `src/lib/modelos-ia.ts` com a lista de modelos por provedor (id, rótulo, descrição, flag de recomendado).
- `src/routes/_authenticated/painel/gestao.configuracoes.tsx`: substituir o `Input` de modelo por um `Select` alimentado por essa lista, com estado extra para o modo "outro" e reset do modelo ao trocar de provedor.
- Nenhuma mudança de banco de dados nem em `agente.server.ts` — a coluna `modelo` já guarda o identificador em texto.
