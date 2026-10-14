# Coletar dados no final do diagnóstico

Hoje o fluxo é: capa → dados pessoais → perguntas → resultado. Isso gera desistência logo no começo. A mudança inverte a ordem: a pessoa responde tudo primeiro e só informa os dados no final, quando já investiu tempo e quer ver o resultado.

## Novo fluxo

```text
Capa  →  Perguntas (1 por tela)  →  Seus dados  →  Resultado
```

- O botão da capa passa a ser "Começar diagnóstico" indo direto para a primeira pergunta.
- Ao responder a última pergunta, em vez de enviar automaticamente, aparece a tela de dados com uma mensagem de conclusão:
  - Título: "Suas respostas foram registradas"
  - Texto: "Falta só um passo: precisamos dos seus dados para enviar o resultado completo por e-mail e para nosso time agendar sua devolutiva."
- A tela de dados mantém exatamente os mesmos campos e validações de hoje (nome, e-mail, WhatsApp, CPF, renda, cargo, estado civil, consentimento LGPD).
- O botão final passa a ser "Ver meu resultado", que envia tudo de uma vez e leva para a página de resultado.
- Botão "Voltar" na tela de dados retorna para a última pergunta, permitindo revisar respostas.
- A barra de progresso passa a considerar a etapa de dados como o último passo (100% só ao enviar).

## Detalhes técnicos

Alteração restrita a `src/routes/d.$slug.tsx` (frontend). Nada muda no servidor, no cálculo de score, no CRM ou no e-mail.

- Reordenar a máquina de estados `etapa`: `"capa" → 0..n-1 → "dados"`.
- O `useEffect` de segurança que hoje dispara `submeterRef.current()` quando o índice ultrapassa o fluxo passa a mudar `etapa` para `"dados"`.
- O envio (`enviarResposta`) passa a ser acionado pelo botão da tela de dados, com o estado de carregamento ("Calculando seu resultado…") exibido nessa mesma tela.
- Botão "Voltar" da tela de dados volta para `perguntasFluxo.length - 1`.
