

## Problema

Ao excluir uma função, o sistema faz soft-delete (`ativo = false`), mas o registro permanece no banco. Quando o usuário tenta criar uma nova função com a mesma chave, viola a constraint `UNIQUE` na coluna `key`.

## Solução

Alterar `CreateRoleModal.tsx` para usar **upsert** ao invés de insert: se já existir um registro com a mesma `key` (inclusive inativo), reativá-lo atualizando seus dados. Caso contrário, criar normalmente.

### Mudança em `src/components/admin/CreateRoleModal.tsx`

Substituir o `insert` por `upsert` com `onConflict: 'key'`:

```tsx
const { data: result, error } = await supabase
  .from("system_roles")
  .upsert(
    {
      key: data.key,
      label: data.label,
      setor: data.setor,
      descricao: data.descricao || null,
      ordem: data.ordem,
      ativo: true,
    },
    { onConflict: 'key' }
  )
  .select()
  .single();
```

Isso reativa a função existente com os novos dados se a chave já existir, ou cria uma nova se não existir. Nenhuma outra mudança necessária.

