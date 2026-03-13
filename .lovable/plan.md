

## Plano: Permitir `analista_rh` preencher vagas

### Problema
A Edge Function `create-user` (linha 85) bloqueia qualquer usuário que não seja `administrador`:
```typescript
if (adminUser.role !== 'administrador') {
  return new Response(JSON.stringify({ error: 'Insufficient permissions - admin role required' }), ...);
}
```

### Solução
Alterar a verificação de permissão na Edge Function `create-user` para aceitar também o role `analista_rh`, além de `administrador`.

**Arquivo**: `supabase/functions/create-user/index.ts`

Substituir a verificação na linha 85:
```typescript
// Antes
if (adminUser.role !== 'administrador') {

// Depois
const allowedRoles = ['administrador', 'analista_rh'];
if (!allowedRoles.includes(adminUser.role)) {
```

Essa é a única alteração necessária. A usuária Jenifer já possui acesso à rota `administrativo_hub` na tabela `user_route_access`, então o bloqueio ocorre exclusivamente na Edge Function.

