

## Ordenação de funções com drag and drop em /direcao/gestao-colaboradores

A tabela `system_roles` já possui coluna `ordem`. O plano é tornar os blocos de função (groups) arrastáveis dentro do setor selecionado usando `@dnd-kit`.

### Mudanças em `GestaoColaboradoresDirecao.tsx`

1. **Ordenar `grouped` por `ordem`** — a query já busca `ordem`, mas o array `rolesForSetor` não respeita essa ordenação. Ordenar com base no campo `ordem` do `system_roles`.

2. **Envolver a lista de grupos com `DndContext` + `SortableContext`** — cada grupo de função será um item sortable (id = role key).

3. **Criar componente `SortableRoleGroup`** — extrai o bloco de cada função (header + grid de cards) para um componente que usa `useSortable`, com um handle de drag (ícone `GripVertical`) no header da função.

4. **`handleDragEnd`** — ao soltar, reordena o array e faz `UPDATE` em batch na tabela `system_roles` atualizando o campo `ordem` de cada role do setor, depois invalida a query.

5. **Atualizar a query `system-roles-active`** para ordenar por `ordem` em vez de `label`.

### Arquivos editados
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx` — adicionar DnD nos grupos de funções + persistir ordem

