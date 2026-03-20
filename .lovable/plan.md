

## Plano: Cor vermelha para não concluídas + ordenação por data decrescente

### Alterações em `src/pages/ChecklistHistorico.tsx`

**1. Trocar cor amarela/amber por vermelha nas não concluídas**
- Ícone `AlertCircle`: de `text-amber-400` para `text-red-400`
- Badge: de `bg-amber-500/20 text-amber-300 border-amber-500/30` para `bg-red-500/20 text-red-300 border-red-500/30`

**2. Ordenar listagem por data decrescente**
- Após aplicar os filtros, ordenar `tarefasFiltradas` por `data_referencia || updated_at` decrescente

