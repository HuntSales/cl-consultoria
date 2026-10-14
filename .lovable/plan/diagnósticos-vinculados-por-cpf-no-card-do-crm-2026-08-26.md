# Diagnósticos vinculados por CPF no card do CRM

Objetivo: dentro do card (drawer) do CRM, listar todos os diagnósticos já preenchidos pela mesma pessoa, identificados pelo CPF, com link direto para cada resultado.

## Comportamento

- Nova seção "Diagnósticos desta pessoa" no drawer do lead, logo abaixo da área de contato/CPF.
- Lista cada diagnóstico preenchido com o mesmo CPF, ordenado do mais recente para o mais antigo, mostrando: título do diagnóstico, data, perfil predominante e score em %.
- Cada item é um link que abre o resultado em nova aba (mesmo padrão do botão "Resultado" atual).
- O diagnóstico do lead atual aparece na lista marcado como "atual" (sem duplicar confusão).
- Se o lead ainda não tem CPF: mensagem curta "Informe o CPF para vincular outros diagnósticos desta pessoa."
- Se o CPF só tem um registro: mensagem "Nenhum outro diagnóstico vinculado a este CPF."
- A lista atualiza automaticamente depois de salvar o CPF.

## Detalhes técnicos

- `src/lib/crm.functions.ts`: nova server function `listarDiagnosticosPorCpf` (autenticada, `requireSupabaseAuth`), recebendo `{ cpf }` normalizado com `apenasDigitosCpf`, consultando `respostas_diagnostico` (`id, diagnostico_id, diagnostico_titulo, perfil_titulo, perfil_cor, score_percentual, criado_em`) filtrada por `cpf` e ordenada por `criado_em desc`.
- `src/components/painel/LeadDrawer.tsx`: `useQuery` com chave `["lead-diagnosticos-cpf", cpfDoLead]`, habilitada só quando o lead tem CPF válido; renderiza a nova seção com o padrão visual atual (badges de perfil e tipografia do painel). Invalida essa query ao salvar o CPF.
- Sem mudanças de banco: a coluna `cpf` já existe em `respostas_diagnostico`.
