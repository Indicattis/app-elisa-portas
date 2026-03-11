

## Bug: Exclusão de funções parece falhar mas na verdade funciona

### Root Cause

The update itself **is working** (evidence: `gerente_fabril`, `coordenador_vendas`, `vendedor` all have `ativo: false` in the database). The problem is the **validation logic after the update**.

The code does:
```ts
const { data, error } = await supabase
  .from('system_roles')
  .update({ ativo: false })
  .eq('key', roleToDelete)
  .select();  // ← THIS is the problem

if (error || !data || data.length === 0) {
  toast.error('Erro ao excluir função...');  // ← always hits this
}
```

After setting `ativo = false`, the `.select()` tries to return the updated row. But there's a SELECT RLS policy: `"Todos podem visualizar system_roles ativos"` which filters `WHERE ativo = true`. Since the row now has `ativo = false`, it's excluded from the SELECT result — so `data` is empty, and the code shows an error even though the update succeeded.

### Fix

In `src/pages/direcao/GestaoColaboradoresDirecao.tsx`, remove `.select()` and only check for `error`:

```ts
const { error } = await supabase
  .from('system_roles')
  .update({ ativo: false })
  .eq('key', roleToDelete);

if (error) {
  toast.error('Erro ao excluir função. Verifique suas permissões.');
} else {
  toast.success('Função excluída com sucesso');
  queryClient.invalidateQueries({ queryKey: ['system-roles'] });
}
```

Single line change in one file.

