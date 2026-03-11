

## Fix: 403 on delete role due to SELECT policy conflict

### Root Cause
The delete operation does `UPDATE ativo=false` + `.select()`. After the update, the row has `ativo = false`. The SELECT policy `"Todos podem visualizar system_roles ativos"` only shows rows where `ativo = true`. Since the user isn't an admin (who has a separate SELECT policy for all rows), PostgREST returns 403 because the updated row is no longer visible.

### Solution
Add a SELECT policy allowing managers (the same roles that can update) to view ALL system_roles, including inactive ones. This way the `.select()` after update can return the modified row.

### Changes

**1. Migration SQL**
```sql
CREATE POLICY "Gestores podem visualizar todos os roles"
ON public.system_roles FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM admin_users
  WHERE admin_users.user_id = auth.uid()
    AND admin_users.role IN (
      'administrador','diretor','gerente_marketing','gerente_comercial',
      'gerente_producao','gerente_fabril','gerente_instalacoes','gerente_financeiro'
    )
    AND admin_users.ativo = true
));
```

No frontend changes needed — the existing error handling and `.select()` logic is correct.

