

# Permitir edição da data de entrega em MinhasVendasEditar

## Alteração

No arquivo `src/pages/vendas/MinhasVendasEditar.tsx`, na seção de "Entrega" (linhas 536-540), substituir o texto estático da `data_prevista_entrega` por um DatePicker editável usando Popover + Calendar.

### Mudanças:
1. **Adicionar imports**: `Popover`, `PopoverTrigger`, `PopoverContent`, `Calendar` e `CalendarIcon`
2. **Adicionar estado** para controlar a data: usar o próprio `venda.data_prevista_entrega` e atualizar no Supabase ao selecionar nova data
3. **Substituir o `<p>` estático** (linhas 536-540) por um botão que abre o Calendar, e ao selecionar uma data, salva automaticamente no banco via `supabase.from('vendas').update({ data_prevista_entrega })` — seguindo o padrão de `T12:00:00.000Z` para evitar problemas de timezone

### Arquivo
- `src/pages/vendas/MinhasVendasEditar.tsx`

