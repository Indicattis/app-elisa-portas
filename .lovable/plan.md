

## Plano: Adicionar checkboxes e reordenar missões com drag-and-drop

### 1. Adicionar novos checkboxes no modo edição (`DetalhesMissaoModal.tsx`)

- Adicionar botão "+ Adicionar item" abaixo da lista de checkboxes quando `editando === true`
- Ao clicar, inserir um novo Input vazio no `localCheckboxes` com ID temporário
- Ao confirmar (blur/Enter), chamar nova mutation `adicionarCheckbox` no hook `useMissoes`
- Novo checkbox recebe `ordem` = último + 1, `missao_id` = missão atual

### 2. Nova mutation `adicionarCheckbox` (`src/hooks/useMissoes.ts`)

- `mutationFn`: insert em `missao_checkboxes` com `{ missao_id, descricao, ordem, prazo }`
- `onSuccess`: invalidar query `["missoes"]`
- Prop nova `onAdicionarCheckbox` passada ao modal

### 3. Drag-and-drop para reordenar missões (`ChecklistLideranca.tsx`)

- Envolver o grid de missões com `DndContext` + `SortableContext` (já usado nos checkboxes)
- Criar componente `SortableMissaoCard` com `useSortable` e handle de arrasto (ícone `GripVertical`)
- Nova mutation `reordenarMissoes` no `useMissoes.ts`: atualiza campo `ordem` na tabela `missoes`
- Requer coluna `ordem integer default 0` na tabela `missoes` (migration SQL)

### 4. Migration SQL

```sql
ALTER TABLE missoes ADD COLUMN ordem integer DEFAULT 0;
```

### Arquivos alterados
- `src/components/todo/DetalhesMissaoModal.tsx` — botão adicionar item, prop `onAdicionarCheckbox`
- `src/hooks/useMissoes.ts` — mutations `adicionarCheckbox` e `reordenarMissoes`, ordenar por `ordem`
- `src/pages/ChecklistLideranca.tsx` — DndContext no grid de missões, `SortableMissaoCard`, passar nova prop
- Migration: adicionar coluna `ordem` em `missoes`

