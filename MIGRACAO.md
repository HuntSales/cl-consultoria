# Migração: CL Consultoria — saindo do Lovable

Este repositório é uma cópia fiel do código do projeto Lovable **"CL Consultoria"**
(commit Lovable `fe643aa0c5a1336f7b8b7fc3bef5d22e7e38f8c4`). Nada foi refatorado:
o objetivo é preservar tudo para recriar o projeto com Claude Code no servidor próprio.

Verificado na cópia: `npm install` + `tsc --noEmit` sem erros e `vite build` concluído.

> **Agente do Claude Code:** leia este arquivo inteiro antes de mexer no código.
> Ele lista tudo que depende do Lovable e precisa ser trocado.

---

## 1. O que NÃO está no repositório (de propósito)

| Item | Motivo | O que fazer |
|---|---|---|
| `.env` | Segredos | Criar a partir de `.env.example` |
| Dados dos clientes (CPFs, respostas, financeiro) | LGPD — não vai para o Git | Exportar à parte do banco antigo e importar no novo (seção 6) |
| `public/favicon.png` | Binário, a API do Lovable corrompe | Baixar do site no ar (seção 5) |
| `src/assets/social-image.png` | Binário | Baixar do site no ar (seção 5) |

---

## 2. Stack

- **TanStack Start** (SSR) + Vite 8 + nitro, React 19, Tailwind v4, shadcn/ui
- **Supabase** (Postgres, Auth, Storage, pgmq, pg_cron, vault, pg_net)
- Gerenciador original: **bun** (`bun.lock`). O `package-lock.json` está **desatualizado**
  (`npm ci` falha); use `bun install` ou `npm install`.

---

## 3. Dependências do Lovable que precisam ser substituídas

| Arquivo / pacote | O que faz hoje | Substituir por |
|---|---|---|
| `vite.config.ts` → `@lovable.dev/vite-tanstack-config` | Junta os plugins (tanstackStart, react, tailwind, tsconfig-paths, nitro) e define o **Cloudflare** como alvo de build | Configurar os plugins na mão e usar o preset nitro `node-server` (ou `bun`) para rodar no servidor próprio |
| `src/integrations/lovable/index.ts` → `@lovable.dev/cloud-auth-js` | Login com Google (`lovable.auth.signInWithOAuth`) usado em `src/routes/entrar.tsx` | `supabase.auth.signInWithOAuth({ provider: "google" })` e configurar o Google OAuth no novo Supabase |
| `src/integrations/supabase/previewAuthStorage.ts` | Armazenamento de sessão para o preview do Lovable | Remover; usar o storage padrão do supabase-js |
| `src/lib/lovable-error-reporting.ts` | Envia erros para o Lovable | Remover ou trocar por Sentry ou similar |
| `src/lib/ai-gateway.server.ts` (`https://ai.gateway.lovable.dev`, `LOVABLE_API_KEY`) | IA de insights, devolutiva e transcrição de áudio | API direta da OpenAI ou Anthropic (há chaves por consultor em `consultor_ai_config`) |
| `src/routes/lovable/email/*` + `@lovable.dev/email-js` + `@lovable.dev/webhooks-js` | Fila de e-mails (pgmq), envio, supressão e preview | **Sugestão: Resend** (ou outro SMTP/API). Ver seção 4 |
| `.lovable/` | Metadados e planos das features | Só referência: os `plan/*.md` explicam o histórico de cada funcionalidade |

---

## 4. Banco de dados (Supabase novo: `yxmrhxvitvhijrhrfmvj`)

1. Atualizar `supabase/config.toml`: `project_id = "yxmrhxvitvhijrhrfmvj"` (hoje aponta para o antigo `ruujhiblfswlgjtyzhaz`).
2. Aplicar o schema:
   ```bash
   supabase link --project-ref yxmrhxvitvhijrhrfmvj
   supabase db push
   ```
   São 26 migrations em `supabase/migrations/`.
3. **Storage:** criar o bucket **privado** `lead-anexos` (anexos das anotações do CRM), com as policies equivalentes.
4. **Infra de e-mail que NÃO está nas migrations** (o Lovable aplicou por fora):
   - função `email_queue_dispatch`;
   - segredo no **vault** usado pelo cron;
   - job **pg_cron** `process-email-queue`, que chama `POST /lovable/email/queue/process` com a service role key.

   Se trocar para Resend, dá para dispensar a fila pgmq e enviar direto em `src/lib/email/devolutiva-email.server.ts`.
5. Domínio de e-mail atual: remetente `notify.cl.corptraining.com.br`, From `cl.corptraining.com.br`. Os DNS estão delegados ao Lovable, então é preciso configurar de novo no provedor escolhido.
6. **Migration dependente de dados:** `20260816231547_...sql` faz updates pelo `diagnostico_id` fixo `2606d463-df24-4729-bc02-80f08d283f2e`. Num banco vazio ela não altera nada. Depois de importar os dados, rode-a de novo (ou confirme que o efeito já veio no dump).
7. Regenerar os tipos se o schema mudar: `supabase gen types typescript --project-id yxmrhxvitvhijrhrfmvj > src/integrations/supabase/types.ts`.

---

## 5. Variáveis de ambiente

Ver `.env.example`. Atenção especial para:

- **`GESTAO_CRYPTO_KEY`**: chave AES-GCM que criptografa as API keys (OpenAI/Anthropic) e os tokens MCP dos consultores em `consultor_ai_config`. **Copie o valor original dos secrets do Lovable.** Sem ele, os dados importados não descriptografam e cada consultor terá de recadastrar as chaves.
- `SUPABASE_SERVICE_ROLE_KEY`: somente no servidor.
- `LOVABLE_API_KEY`: deixa de existir quando o projeto sair do Lovable.

Assets (logos e imagem social) são servidos pelo Lovable em `/__l5e/assets-v1/...`, conforme os arquivos `src/assets/*.asset.json`. Para baixar:

1. Abra o site no ar: https://page-creator-magic-015.lovable.app
2. Baixe o favicon, `logo-cibele-lucena.png`, `logo-cl-monogram.png` e `social-image.png`.
3. Coloque-os em `public/` ou `src/assets/`.
4. Troque os imports `*.asset.json` por imports diretos das imagens.

---

## 6. Dados e usuários (fora do Git)

- Exporte os dados do banco antigo com `pg_dump --data-only` das tabelas `public.*`, ou pelo SQL editor/CSV do Lovable Cloud. Guarde o arquivo em local seguro, **nunca no repositório**.
- Importe no Supabase novo **depois** do `db push`.
- **Usuários (auth.users):** o hash de senha só migra com acesso ao schema `auth`. Se não for possível, recrie os usuários e envie redefinição de senha. Depois, ajuste `profiles` / `user_roles` (papéis `master_admin` e `consultor`; status `pendente`, `aprovado` e `bloqueado`) para os novos IDs.
- Arquivos do bucket `lead-anexos`: baixar e reenviar mantendo os mesmos caminhos.

---

## 7. Checklist de corte

- [ ] `.env` preenchido no servidor (incluindo o `GESTAO_CRYPTO_KEY` original)
- [ ] `config.toml` com o novo project id + `supabase db push`
- [ ] Bucket `lead-anexos` criado
- [ ] Vite config sem `@lovable.dev/vite-tanstack-config`, com preset Node
- [ ] Login Google via Supabase (sem `@lovable.dev/cloud-auth-js`)
- [ ] IA trocada do gateway Lovable para OpenAI/Anthropic direto
- [ ] E-mail trocado para Resend (ou similar) com DNS configurado
- [ ] Imagens baixadas e imports ajustados
- [ ] Dados + usuários + anexos importados
- [ ] Testar: questionário público `/d/$slug`, resultado, e-mail da devolutiva, painel, CRM (kanban), gestão de clientes/agente, analytics
- [ ] Apontar o domínio para o servidor novo
- [ ] **Manter o Lovable no ar até validar tudo**; só então desativar

---

## 8. Mapa rápido do código

- `src/routes/index.tsx`, `cl.tsx`: landing pages
- `src/routes/d.$slug.tsx`: questionário público. `d.$slug_.r.$respostaId.tsx`: resultado
- `src/routes/entrar.tsx`: login/cadastro. `_authenticated/aguardando.tsx`: aprovação pendente
- `src/routes/_authenticated/painel/*`: diagnósticos (editor), CRM, respostas, gestão de clientes (agente IA + MCP MyMoney), analytics, usuários
- `src/lib/*.functions.ts`: server functions (regras de negócio). `*.server.ts`: código só de servidor
- `src/lib/scoring.ts`: cálculo de score/perfis. `perfil-conteudo.ts`: textos dos perfis
- `supabase/migrations/`: schema completo (tabelas, RLS, funções, triggers)
