

## Plan: Add tooltip with next conference date on vehicle row

### Logic
- Calculate "next Monday" from current date using `nextMonday` from `date-fns`
- If conference is **not** up to date (`emDia === false`): tooltip shows "Deveria ter sido conferido em dd/MM/yy" using **last Monday** (the missed deadline)
- If conference **is** up to date: tooltip shows "Próxima conferência: dd/MM/yy" using **next Monday**

### Changes to `src/components/frota/SortableVeiculoRow.tsx`
1. Import `Tooltip, TooltipContent, TooltipTrigger` from `@/components/ui/tooltip` and `nextMonday` from `date-fns`
2. Wrap the entire `<TableRow>` content area (or the "Últ. Conferência" cell specifically) with a `Tooltip` showing the appropriate message
3. Use `startOfWeek(new Date(), { weekStartsOn: 1 })` for the missed deadline date, and `nextMonday(new Date())` for the upcoming one

### Changes to `src/pages/logistica/FrotaMinimalista.tsx`
1. Import `TooltipProvider` and wrap the table (or the page content) with `<TooltipProvider>` so tooltips work

Two files, minimal changes.

