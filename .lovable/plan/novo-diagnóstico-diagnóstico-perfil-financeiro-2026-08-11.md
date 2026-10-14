# Novo diagnóstico: Diagnóstico Perfil Financeiro

Criar um segundo diagnóstico a partir da planilha enviada, reaproveitando toda a estrutura já existente (formulário público, cálculo, CRM, e-mail de devolutiva, analytics). Nada do diagnóstico atual é alterado.

## O que a planilha define

Seis perfis financeiros, cada um com um bloco de perguntas (características, pontos fortes e pontos fracos):

- Investidor
- Poupador
- Pagador Exemplar
- Desapegado
- Descontrolado
- Gastador

Cada pergunta é respondida por uma escala de identificação. O perfil final é o bloco com maior pontuação.

## Como fica para quem responde

- Mesmo fluxo e visual do diagnóstico atual: dados de contato (nome, e-mail, WhatsApp, CPF, renda, profissão), depois as perguntas.
- Cada pergunta usa escala reduzida de 6 opções: 0, 2, 4, 6, 8, 10, com rótulos ("Não tem nada a ver comigo" → "Tem tudo a ver comigo").
- Na tela de resultado: perfil dominante com descrição, pontos fortes e pontos de atenção, mais o ranking dos 6 perfis com barra de pontuação de cada um.
- Botão de agendar sessão estratégica e e-mail de devolutiva funcionam igual ao diagnóstico atual.

## Como fica no painel

- Aparece como um diagnóstico separado na lista, editável pelo editor já existente (capa, dimensões, perguntas, perfis).
- Leads caem no mesmo CRM, com o título do diagnóstico identificando a origem.
- Analytics passa a contemplar os dois diagnósticos.

## Detalhes técnicos

**Banco (migração)**
- Inserir o diagnóstico `Diagnóstico Perfil Financeiro`, slug `perfil-financeiro`, status rascunho, público geral.
- Uma dimensão por perfil (6 dimensões, ramo `comum`, peso 1), com as perguntas da planilha em cada uma.
- Para cada pergunta, 6 opções (`peso` 0/2/4/6/8/10) com rótulos.
- Um `perfis_resultado` por bloco, com título, descrição, cor distinta, pontos fortes/atenção e CTA.
- Nova coluna `dimensao_id` (nullable) em `perfis_resultado` e novo valor `dimensao` para `modo_ativacao`, para permitir "perfil vence pela dimensão de maior percentual". Colunas nullable e valor novo não afetam nenhum perfil existente.

**Cálculo (`src/lib/scoring.ts`, `src/lib/respostas.functions.ts`)**
- `escolherPerfil` ganha um ramo adicional: se houver perfis em modo `dimensao`, vence o perfil ligado à dimensão de maior `scorePercentual` (desempate por ordem). Os modos `faixa`, `regras` e `hibrido` permanecem exatamente como estão, então o diagnóstico atual não muda de comportamento.
- `dimensoes_resultado` já é persistido — é o que alimenta o ranking dos 6.

**Front**
- `src/routes/d.$slug.tsx`: renderizar opções em escala numérica quando a pergunta tiver 6 opções com rótulos de escala (ajuste visual, mesma lógica de seleção).
- `src/routes/d.$slug_.r.$respostaId.tsx`: bloco de ranking dos perfis usando `dimensoes_resultado`, exibido quando o diagnóstico usa modo `dimensao`.
- Editor de perfis (`painel`): seletor de dimensão quando o modo escolhido for `dimensao`.

## Fora de escopo

Nenhuma alteração no diagnóstico "Diagnóstico Financeiro Comportamental", nas suas perguntas, perfis ou nos leads já registrados.
