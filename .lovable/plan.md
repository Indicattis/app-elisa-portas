

## Diagnóstico: `atendente` aparece em dois setores

### Causa
A função `getRolesForSetor` combina duas fontes:
1. **Hardcoded** (`SETOR_ROLES`): `atendente` está mapeado para `vendas`
2. **Dinâmico** (`system_roles` tabela): `atendente` provavelmente tem `setor = 'administrativo'` no banco

O filtro dinâmico (linha 233) só exclui roles que já estão no hardcoded **do mesmo setor**. Como `atendente` está no hardcoded de `vendas`, ele não é excluído do dinâmico de `administrativo`.

### Solução
Usar **apenas** `system_roles` como fonte de verdade para o setor, eliminando a dependência do `SETOR_ROLES` hardcoded na função `getRolesForSetor`.

### Mudança em `GestaoColaboradoresDirecao.tsx`

Substituir `getRolesForSetor` por:
```tsx
const getRolesForSetor = (setor: string) => {
  return (systemRoles || [])
    .filter(r => r.setor === setor)
    .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))
    .map(r => r.key);
};
```

Isso elimina a duplicação e torna `system_roles.setor` a única fonte de verdade. Remover o import de `SETOR_ROLES` se não for mais utilizado em nenhum outro ponto do arquivo.

### Arquivo editado
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

