# CPF nos diagnósticos + nova área "Gestão de Clientes" com agente de IA

## 1. CPF em todos os diagnósticos

- Novo campo **CPF (obrigatório)** na etapa "Seus dados" do formulário público, com máscara `000.000.000-00` e validação de dígitos verificadores (bloqueia o envio se inválido).
- CPF gravado junto da resposta e exibido no CRM (card e detalhamento do lead), com opção de editar/corrigir.
- Ao marcar um lead como **Ganho**, o CPF passa a ser obrigatório: se estiver vazio, o sistema pede o preenchimento antes de concluir o fechamento.
- Respostas antigas continuam válidas sem CPF; ficam sinalizadas como "CPF pendente" no CRM.

## 2. Nova aba "Gestão de Clientes"

Nova entrada no menu do painel, com três telas:

### 2.1 Configurações
- Escolha do provedor de IA: **OpenAI (ChatGPT)** ou **Anthropic (Claude)**.
- Campo para a chave de API do provedor escolhido, salva **por consultor** e de forma criptografada (nunca exibida de volta, apenas "chave configurada" + opção de substituir/remover).
- Campos do **MCP MyMoney**: URL do servidor e token de acesso, com botão "Testar conexão" que valida se o servidor responde.
- Seleção do modelo (lista compatível com o provedor escolhido).

### 2.2 Clientes
- Cadastro de cliente por **CPF**: ao digitar, o sistema verifica automaticamente se já existe no CRM e se há diagnósticos realizados, mostrando o resultado ("cliente encontrado, 2 diagnósticos" / "sem registro"). O cadastro é permitido em qualquer caso.
- Campos: CPF, nome, e-mail/telefone (pré-preenchidos quando o CPF é encontrado no CRM) e **chave MCP do cliente** no MyMoney, que faz o vínculo do CPF ao sistema financeiro.
- Lista de clientes vinculados, com status do vínculo MyMoney e atalho para o lead no CRM.

### 2.3 Consulta com o agente
- Campo de texto para o consultor escrever o pedido de insight.
- **10 sugestões de prompt** clicáveis abaixo do campo (ex.: leitura de perfil comportamental x comportamento real de gastos, riscos de endividamento, plano de ação para 90 dias, temas para a próxima devolutiva, evolução entre diagnósticos, oportunidades de investimento conforme perfil, alertas de fluxo de caixa, argumentos de retenção, resumo executivo do cliente, próximos passos comerciais).
- **Microfone** à direita: grava a voz, transcreve pela IA da Lovable e cola o texto no campo, permitindo edição antes de enviar.
- O agente recebe, no contexto: todos os diagnósticos e respostas daquele CPF, todos os campos do CRM (etapa, origem, resultado, motivo de perda, valor, renda, cargo, próximo contato) e o histórico de anotações e eventos do lead — além do acesso, via MCP MyMoney, ao sistema de gestão financeira do cliente (ferramentas expostas pelo servidor MCP).
- Resposta exibida em streaming, com formatação (títulos, listas).
- Após a conversa: botões **Salvar histórico** ou **Descartar**.

### 2.4 Linha do tempo
- Área com o histórico salvo por cliente, em ordem cronológica; cada item abre a conversa completa (pedidos + insights) para releitura.

## Detalhes técnicos

- **Banco (novas tabelas):** `clientes_gestao` (cpf, nome, contato, chave MCP criptografada, consultor dono, vínculo com lead), `consultor_ai_config` (provedor, chave criptografada, modelo, URL/token MCP), `agente_conversas` + `agente_mensagens` (histórico salvo). Coluna `cpf` em `respostas_diagnostico`. RLS por consultor; master admin enxerga tudo. GRANTs em todas as tabelas novas.
- **Chaves:** armazenadas cifradas (AES-GCM) com segredo do servidor; descriptografadas apenas dentro do server function que chama o modelo. Nunca trafegam para o navegador.
- **Agente:** server function/rota de streaming com AI SDK; provider OpenAI ou Anthropic conforme configuração do consultor, com as ferramentas do MCP MyMoney carregadas via cliente MCP (`@ai-sdk/mcp`, transporte HTTP com Bearer token) somadas a ferramentas internas de leitura (diagnósticos, CRM, anotações). Clientes MCP fechados ao fim do stream.
- **Transcrição:** rota server que envia o áudio para o endpoint de transcrição da Lovable AI (`openai/gpt-4o-transcribe`), gravação em WAV no navegador.
- **URL/token do MyMoney:** não recebi o anexo com esses dados; por isso ficam como campos configuráveis na tela de Configurações. Se você enviar a URL, deixo pré-preenchida.

## Entrega em etapas

1. CPF (formulário, banco, CRM, regra do "Ganho").
2. Aba Gestão de Clientes: Configurações + Clientes (com validação por CPF e vínculo MCP).
3. Agente: prompt, sugestões, microfone, contexto de diagnósticos/CRM + MCP.
4. Salvar/descartar e linha do tempo dos históricos.
