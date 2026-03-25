

## Plano: Permitir leitura da tabela `clientes` pelo role `anon`

### Situação atual
A tabela `clientes` tem RLS ativo com política SELECT que exige `auth.uid() IS NOT NULL`. O CRM externo usa a `anon key`, que não tem sessão autenticada, resultando em array vazio.

### Alerta de segurança
A tabela `clientes` contém dados pessoais sensíveis (nome, telefone, email, CPF/CNPJ, endereço). Liberar acesso ao role `anon` significa que **qualquer pessoa com a anon key** (que é pública) poderá ler esses dados. 

**Recomendação**: Em vez de liberar para `anon`, o CRM deveria autenticar-se com um usuário real (email/senha via `supabase.auth.signInWithPassword`). Assim a política existente já funcionaria sem expor dados pessoais publicamente.

### Opção 1 (Recomendada - Segura): Autenticar o CRM
Não requer mudança neste projeto. No CRM, fazer login com credenciais de um usuário existente antes de consultar a tabela. A política atual já permite SELECT para usuários autenticados.

### Opção 2 (Rápida - Menos segura): Criar política para `anon`
Criar uma nova política permitindo leitura apenas de clientes ativos pelo role `anon`:

```sql
CREATE POLICY "Anon can read active clientes"
ON public.clientes
FOR SELECT
TO anon
USING (ativo = true);
```

Isso expõe dados pessoais a qualquer portador da anon key.

### Qual caminho seguir?
Se você quer a solução rápida (Opção 2), posso aplicar a migração imediatamente. Se preferir a opção segura (Opção 1), a mudança será feita no projeto CRM.

