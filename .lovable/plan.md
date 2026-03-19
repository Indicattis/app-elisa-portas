

## Plano: Voltar login para Email/Senha + Redefinir senhas padrão

### Parte 1: Alterar `/auth` para login com email e senha

**Arquivo**: `src/pages/Auth.tsx`

- Substituir o campo de CPF por dois campos: **Email** e **Senha**
- Remover lógica de formatação de CPF e chamada à edge function `manage-producao-auth`
- Usar `signIn(email, password)` do `useAuth` diretamente
- Atualizar textos: "Digite seu email e senha para acessar"

### Parte 2: Redefinir senhas de todos os usuários

**Nova Edge Function**: `supabase/functions/bulk-reset-passwords/index.ts`

- Busca todos os usuários ativos da tabela `admin_users` (com `nome` e `user_id`)
- Para cada um, gera a senha padrão: **primeira letra do nome + sobrenome** (minúsculo, sem acentos)
- Usa `supabaseAdmin.auth.admin.updateUserById()` para redefinir a senha
- Requer autenticação de admin para executar
- Será executada uma única vez após deploy

### Regra da senha padrão
Exemplo: "João Silva" → `jsilva`, "Maria Santos" → `msantos`

