

## Plano: Editar missões com reescrita de tarefas e drag-and-drop

### O que será feito
Adicionar modo de edição no `DetalhesMissaoModal` permitindo reescrever descrições dos checkboxes e reordená-los via drag-and-drop. O projeto já possui `@dnd-kit` instalado.

### Alterações

#### 1. `src/hooks/useMissoes.ts`
Adicionar duas mutations:

- **`editarCheckbox`**: atualiza `descricao` de um checkbox via `supabase.from('missao_checkboxes').update({ descricao }).eq('id', id)`
- **`reordenarCheckboxes`**: recebe array de `{ id, ordem }` e faz batch update (loop de updates) para persistir a nova ordem

#### 2. `src/components/todo/DetalhesMissaoModal.tsx`
- Adicionar estado `editando` (boolean) com botão de toggle (ícone Pencil/Check)
- **Modo visualização** (atual): checkboxes com marcação normal
- **Modo edição**:
  - Cada descrição vira um `<Input>` editável inline; ao blur/enter salva via `editarCheckbox`
  - Lista envolvida por `DndContext` + `SortableContext` do `@dnd-kit/sortable`
  - Cada item ganha um handle de arrastar (ícone GripVertical)
  - Ao soltar, calcula nova ordem e chama `reordenarCheckboxes`
  - Checkboxes ficam desabilitados durante edição
- Importar `DndContext`, `SortableContext`, `useSortable`, `arrayMove`, `closestCenter`, `restrictToVerticalAxis`

### Fluxo do usuário
```text
┌─────────────────────────────┐
│ Título da Missão      [✏️] │
│─────────────────────────────│
│ ≡  [Input: Tarefa 1]       │  ← arrastar + editar
│ ≡  [Input: Tarefa 2]       │
│ ≡  [Input: Tarefa 3]       │
│─────────────────────────────│
│ [Excluir missão]            │
└─────────────────────────────┘
```

Nenhuma alteração de banco necessária — as colunas `descricao` e `ordem` já existem em `missao_checkboxes`.

