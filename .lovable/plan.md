

## Plano: Adicionar salário nos cards de colaboradores

### Mudanças

**1. `src/hooks/useAllUsers.ts`**
- Adicionar `salario?: number | null` na interface `User`
- Adicionar `salario` no select da query (já usa `select("*")`, então basta adicionar ao tipo)

**2. `src/pages/direcao/GestaoColaboradoresDirecao.tsx`**
- No card do colaborador (dentro de `SortableRoleGroup`, linhas 134-144), adicionar abaixo do email uma linha mostrando o salário formatado em BRL (ex: "R$ 3.500,00")
- Usar `Intl.NumberFormat` para formatar, estilo discreto (`text-xs text-emerald-400/60`) para não poluir o card
- Se `salario` for null, não exibir nada

