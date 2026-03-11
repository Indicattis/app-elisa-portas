

## Diagnóstico: Por que a exclusão não funciona visualmente

O update no banco **funciona** (a toast de sucesso aparece). O problema é que a **lista de funções exibidas vem de uma constante hardcoded** (`SETOR_ROLES` em `setorMapping.ts`), e **não** da query `systemRoles` que busca do banco.

Linha 73:
```ts
const rolesForSetor = SETOR_ROLES[selectedSetor] || [];
```

Isso significa que mesmo após marcar `ativo = false` no banco e invalidar a query, a lista continua mostrando as mesmas funções estáticas.

## Correção

Em `GestaoColaboradoresDirecao.tsx`, filtrar `rolesForSetor` para mostrar apenas roles que existem como ativos no banco:

```ts
// Linha 73 - trocar:
const rolesForSetor = SETOR_ROLES[selectedSetor] || [];

// Por:
const activeRoleKeys = (systemRoles || []).map(r => r.key);
const rolesForSetor = (SETOR_ROLES[selectedSetor] || []).filter(
  role => activeRoleKeys.includes(role)
);
```

Isso faz com que, ao excluir uma função (setar `ativo = false`), a invalidação da query `system-roles-active` recarregue a lista de roles ativos, e a função excluída desapareça da tela.

**Arquivo:** `src/pages/direcao/GestaoColaboradoresDirecao.tsx` — uma única alteração.

