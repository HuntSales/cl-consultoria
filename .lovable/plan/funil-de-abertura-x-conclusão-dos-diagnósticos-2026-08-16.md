# Funil de abertura x conclusão dos diagnósticos

Hoje só existe registro quando o lead termina o diagnóstico (tabela de respostas). Não há como saber quantas pessoas abriram o link e desistiram no meio. A proposta é medir a jornada inteira, para todos os diagnósticos, sem mudar a experiência do respondente.

## O que será medido

Cada acesso ao link público vira uma "sessão" anônima com marcos:

1. **Abriu** — carregou a capa do diagnóstico
2. **Começou** — respondeu a primeira pergunta
3. **Chegou nos dados** — terminou as perguntas e viu o formulário de contato
4. **Concluiu** — enviou e gerou a resposta

Nenhum dado pessoal é gravado antes do envio do formulário — só um identificador aleatório da sessão, o diagnóstico e os horários.

## Onde aparece

Na área de Analytics do painel, uma nova seção "Funil de preenchimento":

- Cards por diagnóstico: Aberturas, Iniciados, Chegaram nos dados, Concluídos
- Taxa de conclusão (concluídos ÷ aberturas) e taxa de abandono
- Ponto de maior abandono (ex.: "62% saem antes de terminar as perguntas")
- Total geral somando todos os diagnósticos
- Filtro de período (7 / 30 / 90 dias / tudo), seguindo o padrão atual da tela

## Detalhes técnicos

**Banco** — nova tabela `public.diagnostico_sessoes`:
`id`, `diagnostico_id` (FK), `sessao_key` (uuid do navegador), `aberto_em`, `iniciado_em`, `dados_em`, `concluido_em`, `resposta_id` (FK opcional), `origem/utm` (jsonb), `criado_em`.
RLS: `INSERT`/`UPDATE` liberado para `anon` e `authenticated` apenas na própria linha via `sessao_key` (sem SELECT público); `SELECT` só para usuários aprovados do painel. GRANTs correspondentes na mesma migração.

**Registro** — server functions públicas em `src/lib/respostas.functions.ts` (`registrarAbertura`, `marcarEtapaSessao`) chamadas de `src/routes/d.$slug.tsx`: na montagem da capa, na primeira resposta, ao entrar na etapa "dados" e no envio (aí também grava `resposta_id`). O `sessao_key` fica em `sessionStorage`, então recarregar a página não infla a contagem.

**Leitura** — nova função em `src/lib/analytics.functions.ts` (`obterFunilDiagnosticos`) agregando as sessões por diagnóstico e período, consumida pela tela `src/routes/_authenticated/painel/analytics.tsx` com os componentes de gráfico já usados lá.

**Histórico** — dados começam a contar a partir da implantação; respostas antigas seguem aparecendo nas métricas atuais de conclusão.
