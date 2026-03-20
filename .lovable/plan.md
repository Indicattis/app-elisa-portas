

## Plano: Permitir acesso à página de permissões para não-administradores

### Problema
O componente `UserRouteAccessManager` bloqueia qualquer usuário que não seja `administrador` (verifica `isAdmin` do `useAuth`). Usuários com acesso à rota `/admin/permissions` via `user_route_access` são barrados pelo componente mesmo tendo permissão na rota.

### Solução
Remover a dependência de `isAdmin` no componente e usar a própria presença na página como prova de autorização (a rota já é protegida por `ProtectedRoute` com `routeKey`).

### Mudanças em `src/components/UserRouteAccessManager.tsx`

1. **Remover o guard `isAdmin`** (linhas 210-218) — deletar o bloco que retorna o `Alert` de "apenas administradores".

2. **Remover `isAdmin` das condições `enabled`** das queries (linhas 100, 116, 133) — trocar `enabled: isAdmin` por `enabled: true` (ou simplesmente remover), para que as queries rodem para qualquer usuário que chegue à página.

3. **Remover import de `isAdmin`** — ajustar o destructuring de `useAuth()` na linha 62 para não pegar mais `isAdmin` (ou mantê-lo se for usado em outro lugar — verificar).

### Segurança
O acesso à página já é controlado por `ProtectedRoute` com `routeKey` no `App.tsx`. As operações no banco (`user_route_access`, `app_routes`) dependem das RLS policies do Supabase, não do frontend. A remoção do guard no componente não compromete a segurança.

### Arquivo
- `src/components/UserRouteAccessManager.tsx`

