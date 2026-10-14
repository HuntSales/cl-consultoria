# Remetente do e-mail no domínio próprio

Hoje a devolutiva já é enviada pela infraestrutura do seu domínio verificado, mas o endereço exibido para o lead é `noreply@notify.cl.corptraining.com.br`. Você quer que apareça `noreply@cl.corptraining.com.br`.

## O que muda

- O nome e endereço exibidos no e-mail passam a ser:
  `Cibele Lucena Consultoria Financeira <noreply@cl.corptraining.com.br>`
- A entrega técnica continua pelo subdomínio verificado (`notify.cl.corptraining.com.br`), que é o que garante autenticação e boa entregabilidade. Isso é invisível para o lead.
- Vale para os dois caminhos de envio: a devolutiva automática do diagnóstico e o botão "Reenviar devolutiva" no CRM, além de qualquer outro e-mail do app.

## Detalhes técnicos

- Ajustar a constante `FROM_DOMAIN` para `cl.corptraining.com.br` em:
  - `src/lib/email/devolutiva-email.server.ts`
  - `src/routes/lovable/email/transactional/send.ts`
- Manter `SENDER_DOMAIN` como `notify.cl.corptraining.com.br` (domínio verificado usado no envio).
- Após a alteração, disparar um reenvio de teste da última devolutiva e conferir no registro de envios que saiu como `sent`. Caso o provedor recuse o remetente na raiz (opção "exibir a partir do domínio raiz" não habilitada), voltamos para `noreply@notify.cl.corptraining.com.br` e eu aviso.

## Observação

Os e-mails de autenticação (login/recuperação de senha do painel) ainda usam o modelo padrão da plataforma. Se quiser, também posso trazê-los para o seu domínio e identidade visual — não está incluído neste plano.
