

## Plano: Drag and drop para reordenar colaboradores dentro de cada grupo de função

### Problema
Atualmente, apenas os **grupos de função** (role groups) podem ser reordenados via drag-and-drop. Os **colaboradores dentro de cada grupo** não têm ordenação arrastável.

### Mudanças necessárias

#### 1. Adicionar coluna `ordem` na tabela `admin_users`
- Adicionar coluna `ordem integer default 0` à tabela `admin_users`
- Isso persiste a posição de cada colaborador dentro do seu grupo

#### 2. Modificar `SortableRoleGroup` para suportar DnD interno de colaboradores
- Envolver o grid de user cards com um **segundo `DndContext` + `SortableContext`** (nested, separado do DnD de roles)
- Cada card de usuário vira um `SortableUserCard` com `useSortable` e ícone `GripVertical`
- O drag handle aparece no hover, ao lado do avatar

#### 3. Criar componente `SortableUserCard`
- Wrapper sortable ao redor do card de colaborador existente (linhas 189-236)
- Adiciona `GripVertical` como drag handle
- Estilo com opacity reduzida durante arrasto

#### 4. Handler `handleUserDragEnd` no componente principal
- Recebe o role group para saber qual grupo foi reordenado
- Calcula nova ordem e faz update otimista no cache `all-users`
- Persiste via `supabase.from('admin_users').update({ ordem })` para cada usuário reordenado

#### 5. Ordenar usuários por `ordem` no agrupamento
- Na construção do `grouped` (linha 346-352), ordenar `users` por `ordem` ascendente
- Garantir que o hook `useAllUsers` retorna o campo `ordem`

### Arquivo modificado
- `src/pages/direcao/GestaoColaboradoresDirecao.tsx` -- adicionar `SortableUserCard`, nested DnD context, handler de reordenação

### Observação importante
Como já existe um `DndContext` para reordenar roles, o DnD de colaboradores usará um **DndContext separado nested** dentro de cada `SortableRoleGroup`, evitando conflitos entre os dois níveis de drag-and-drop.

