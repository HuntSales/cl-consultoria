# Novo usuário master admin: Cibele Lucena

Criar o acesso de **Cibele Lucena** (clconsultoria.financas@gmail.com) com exatamente o mesmo nível do william@huntsales.com.br, que hoje é `master_admin` com status `aprovado`.

## O que será feito

1. Criar a conta de login com o e-mail e a senha informados, já com e-mail confirmado (sem precisar clicar em link de confirmação).
2. Registrar o nome completo "Cibele Lucena" no perfil.
3. Deixar o perfil com status **aprovado** (acesso liberado imediatamente).
4. Conceder o papel **master_admin** — mesmo papel do William, com acesso total ao painel, CRM, diagnósticos, analytics, gestão de clientes e administração de usuários.

## Detalhes técnicos

- A conta é criada via API administrativa de autenticação (chave de serviço, executada apenas no servidor), com `email_confirm: true`.
- O gatilho existente `handle_new_user` cria automaticamente o perfil como `pendente`/`consultor`; em seguida uma atualização de dados ajusta o perfil para `aprovado` (com `aprovado_em` e `aprovado_por` = William) e troca a linha em `user_roles` para `master_admin`.
- Nenhuma mudança de schema, RLS ou código da aplicação é necessária.
- A senha informada será usada apenas na criação; recomenda-se que ela seja trocada após o primeiro acesso.

## Verificação

Consulta final em `profiles` + `user_roles` confirmando: status `aprovado` e papel `master_admin` para o novo e-mail.
