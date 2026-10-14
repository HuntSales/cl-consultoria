# Anotações com anexos e ditado no card do CRM

Hoje o painel do lead permite apenas digitar uma anotação em texto. A ideia é permitir também **gravar por voz** (transcrição automática) e **anexar arquivos**, com tudo aparecendo na linha do tempo do lead.

## O que muda para o consultor

No painel do lead (ao clicar no card do CRM), na área "Anotações e histórico":

- Um botão de **microfone** ao lado do campo de texto: grava, transcreve automaticamente e insere o texto na anotação (o consultor pode revisar antes de salvar). Mesma experiência já usada no chat do agente.
- Um botão de **anexo**: seleciona um ou mais arquivos (PDF, imagem, planilha, áudio, etc., até 20 MB cada) que ficam vinculados à anotação.
- Anexos podem ser adicionados junto com a anotação ou sozinhos (anotação sem texto, só arquivo).
- Na linha do tempo, cada anotação mostra o texto, os arquivos anexados (com ícone, nome, tamanho e link para abrir/baixar) e uma marca discreta quando o texto veio de ditado.
- Excluir a anotação remove também os arquivos dela.
- A linha do tempo passa a ser **unificada e ordenada por data** (anotações + eventos de etapa/origem/resultado, hoje listados em blocos separados).

## Detalhes técnicos

**Storage**
- Novo bucket privado `lead-anexos` (criado via ferramenta de storage), caminho `{resposta_id}/{anotacao_id}/{uuid}-{nome}`.
- Políticas RLS em `storage.objects` seguindo o mesmo critério de acesso já usado em `lead_anotacoes` (usuário aprovado / master admin).
- Leitura pelos links via **signed URL** gerada sob demanda numa server function (bucket privado).

**Banco (migração)**
- Nova tabela `public.lead_anexos`: `id`, `anotacao_id` (FK → `lead_anotacoes`, ON DELETE CASCADE), `resposta_id`, `path`, `nome`, `mime`, `tamanho`, `criado_em`.
- `GRANT SELECT, INSERT, DELETE ... TO authenticated` + `GRANT ALL TO service_role`, RLS habilitado e políticas equivalentes às de `lead_anotacoes`.
- Coluna opcional `origem text` em `lead_anotacoes` (`manual` | `ditado`) para marcar anotações ditadas.

**Server functions (`src/lib/crm.functions.ts`)**
- `criarAnotacao`: aceitar `anexos` (metadados já enviados ao storage) e `origem`.
- `registrarAnexos` / `gerarUrlAnexo` (signed URL) / exclusão de arquivos junto com a anotação.
- `obterLead`: retornar os anexos dentro de cada anotação.

**Reuso**
- `transcreverAudio` de `src/lib/gestao.functions.ts` já existe e será reutilizado; a lógica de `MediaRecorder` de `gestao.$clienteId.tsx` será extraída para um hook `useDitado` compartilhado.

**UI**
- `src/components/painel/LeadDrawer.tsx`: novos controles de gravação/anexo, upload via cliente Supabase no navegador, e renderização da linha do tempo unificada.
