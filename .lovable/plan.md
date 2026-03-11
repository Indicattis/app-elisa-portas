

## Bug Analysis: Exclusão de funções mostra sucesso mas não funciona

### Root Cause

Two issues working together:

1. **RLS Policy blocks the update silently.** The `system_roles` table UPDATE policy only allows users with `role = 'administrador'`. If you're logged in as "diretor", the Supabase update query returns no error — it simply affects 0 rows. The code only checks `if (error)`, so it falls through to the success toast.

2. **Code doesn't verify rows were actually updated.** The `handleDeleteRole` function (line 107-122 of `GestaoColaboradoresDirecao.tsx`) does `.update({ ativo: false }).eq('key', roleToDelete)` but never checks if any row was actually modified.

### Fix

**1. Update RLS policy** — Add `diretor` to the UPDATE policy on `system_roles` so directors can also manage roles (consistent with them having access to this management page).

SQL migration:
```sql
DROP POLICY IF EXISTS "Admins podem atualizar roles" ON system_roles;
CREATE POLICY "Admins e diretores podem atualizar roles"
ON system_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'diretor')
    AND ativo = true
  )
);
```

Also update INSERT and DELETE policies similarly for consistency.

**2. Add response validation in code** — In `handleDeleteRole`, check if the update actually returned data. If no rows were affected, show an error instead of success.

```ts
const { data, error } = await supabase
  .from('system_roles')
  .update({ ativo: false })
  .eq('key', roleToDelete)
  .select();

if (error || !data || data.length === 0) {
  toast.error('Erro ao excluir função. Verifique suas permissões.');
} else {
  toast.success('Função excluída com sucesso');
  queryClient.invalidateQueries({ queryKey: ['system-roles'] });
}
```

### Files changed
- **SQL migration** — Update RLS policies for `system_roles` to include `diretor`
- **`src/pages/direcao/GestaoColaboradoresDirecao.tsx`** — Add `.select()` and validate returned data in `handleDeleteRole`

