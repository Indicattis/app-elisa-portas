

## Plano: Permitir reset de senha para usuários autorizados em /admin/users

### Problema
A Edge Function `reset-user-password` restringe o reset de senha exclusivamente ao role `administrador` (linha 86: `adminUser.role !== 'administrador'`). Qualquer outro usuário, mesmo com acesso à rota `/admin/users`, recebe erro 403 "Insufficient permissions".

### Solução
Flexibilizar a verificação na Edge Function para aceitar qualquer usuário ativo que tenha acesso à rota `/admin/users` (via `user_route_access`) OU que seja administrador. Isso mantém a segurança usando o mesmo sistema de permissões já existente no projeto.

### Arquivo alterado
- `supabase/functions/reset-user-password/index.ts`

### Detalhes técnicos

Substituir a verificação rígida de role por uma consulta que verifica:
1. Se o usuário é administrador (`role = 'administrador'`), OU
2. Se o usuário tem `bypass_permissions = true`, OU  
3. Se o usuário tem acesso à rota `/admin/users` na tabela `user_route_access`

```typescript
// Antes (restritivo):
if (adminUser.role !== 'administrador' || !adminUser.ativo) { return 403 }

// Depois (flexível):
if (!adminUser.ativo) { return 403 }

const isAdmin = adminUser.role === 'administrador' || adminUser.bypass_permissions === true;

if (!isAdmin) {
  // Verificar acesso à rota /admin/users
  const { data: routeAccess } = await supabaseAdmin
    .from('user_route_access')
    .select('id')
    .eq('user_id', requestingUser.id)
    .eq('route_key', 'admin_users')
    .single();
  
  if (!routeAccess) { return 403 }
}
```

