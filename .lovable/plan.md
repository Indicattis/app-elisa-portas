

## Plan: Show all roles, allow deletion of empty ones, improve vaga button

### Changes to `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

**1. Show all roles per sector**
- Remove the `.filter(g => g.users.length > 0 || g.openVagas > 0)` so every role in `SETOR_ROLES` for the selected sector is always displayed, even if empty.

**2. Allow deleting empty roles**
- Add a delete button (Trash2 icon) next to role headers, visible only when `group.users.length === 0 && group.openVagas === 0`.
- On click, show an `AlertDialog` confirming deletion.
- On confirm, call `supabase.from('system_roles').delete().eq('key', role)` and also remove the role from `SETOR_ROLES` mapping (or just invalidate queries and let the page refresh). Since `system_roles` is the source of truth and `SETOR_ROLES` is hardcoded, we'll set `ativo = false` instead of deleting, matching the existing pattern used elsewhere.
- Invalidate `system-roles` and related queries.

**3. Replace "+ Vaga" button with a card**
- Remove the small text button from the role header.
- Add a clickable card at the end of each role's grid (after users and open vagas) styled like a collaborator card but with a dashed border and a "+" icon in the avatar area, similar to the existing vacancy placeholders but clickable.
- Clicking it opens the existing vaga justification dialog.

**4. Fetch system_roles for labels**
- Query `system_roles` to get dynamic labels instead of relying solely on the hardcoded `ROLE_LABELS`, ensuring newly created roles display correctly.

### Files changed
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx` — all changes in this single file

