

## Plan: Add "Change Role" button to user cards

### Changes to `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

**1. Add state and data for role change**
- New state: `userToChangeRole` (User | null), `newRole` (string), `changingRole` (boolean)
- Fetch active `system_roles` with a `useQuery` call (pattern already used in many files)

**2. Add button next to deactivate**
- Next to the `UserMinus` button, add a `RefreshCw` (or `ArrowRightLeft`) icon button with same hover-reveal style
- On click, sets `userToChangeRole` to the user and opens a dialog

**3. Add role change dialog**
- `Dialog` with a `Select` dropdown listing all active roles from `system_roles`
- "Confirmar" button calls `supabase.from('admin_users').update({ role: newRole }).eq('id', user.id)` then invalidates `all-users`
- Import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from ui/select

### Files changed
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

