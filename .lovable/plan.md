

## Plan: Add deactivation, job openings, and headcount scoreboard to Organograma RH

### Overview

Enhance `GestaoColaboradoresDirecao.tsx` with three features:
1. **Deactivate users** — click a user card to show a confirmation dialog, then set `ativo = false` in `admin_users`
2. **Add job openings** — button per role group to create a vaga (reuses existing `useVagas` hook + `vagas` table)
3. **Headcount scoreboard** — each role header shows `colaboradores / (vagas abertas + colaboradores)` count

### Changes

**1. `src/pages/direcao/GestaoColaboradoresDirecao.tsx`**

- Import `useVagas` hook, `AlertDialog` components, `supabase` client, `useQueryClient`
- Add state for user deactivation confirmation (`userToDeactivate`)
- On user card click → open AlertDialog confirming deactivation → call `supabase.from('admin_users').update({ ativo: false }).eq('id', user.id)` → invalidate `all-users` query
- Add a `+ Vaga` button next to each role group header → opens a small dialog to input justification → calls `createVaga({ cargo: role, justificativa })` from `useVagas`
- Update role header badge to show scoreboard: fetch open vagas (`status = 'aberta' OR status = 'em_analise'`) for each role, display as `{users.length} / {users.length + openVagas}` with color coding (green if full, amber if has open vagas)

**2. No database changes needed** — uses existing `admin_users.ativo` field and `vagas` table

### Files changed
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx` — all three features

