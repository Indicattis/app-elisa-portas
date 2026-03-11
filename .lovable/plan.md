

## Plan: Add drag-and-drop reordering to fleet listing

### Database change
- Add `ordem` column to `veiculos` table (integer, default 0) to persist sort order

### Changes to `src/hooks/useVeiculos.ts`
- Change query ordering from `.order('nome')` to `.order('ordem').order('nome')` so manual order takes precedence
- Add `updateOrdem` mutation that batch-updates `ordem` for each vehicle after reorder

### Changes to `src/pages/logistica/FrotaMinimalista.tsx`
Following the existing pattern from `ProdutosFabrica.tsx`:

1. **Imports**: Add `DndContext`, `closestCenter`, `useSensor`, `useSensors`, `PointerSensor`, `KeyboardSensor` from `@dnd-kit/core`; `SortableContext`, `verticalListSortingStrategy`, `useSortable`, `arrayMove` from `@dnd-kit/sortable`; `GripVertical` icon
2. **Create `SortableVeiculoRow` component**: Wraps each `TableRow` with `useSortable`, adds a drag handle column with `GripVertical` icon
3. **Local state**: `orderedVeiculos` synced from query data, updated optimistically on drag end
4. **DndContext + SortableContext**: Wrap the `Table` body, using `verticalListSortingStrategy`
5. **onDragEnd handler**: Calls `arrayMove`, updates local state, then persists new `ordem` values to Supabase
6. **Add drag handle column**: New first `TableHead` + `TableCell` with grip icon (colSpan updated to 12 for empty state)

### Files changed
- `src/hooks/useVeiculos.ts`
- `src/pages/logistica/FrotaMinimalista.tsx`
- SQL: `ALTER TABLE veiculos ADD COLUMN ordem integer DEFAULT 0`

