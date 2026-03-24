

## Plano: Transformar /vendas/leads em CRM Kanban com drag-and-drop

### Visão geral
Substituir a listagem atual por um board Kanban com 5 colunas (uma por status), onde os leads podem ser arrastados entre colunas para atualizar seu status.

### Colunas do Kanban
```text
┌──────────┬───────────────┬──────────────────┬────────────────┬──────────┐
│   Novo   │ Em Atendimento│ Orçamento Enviado│ Venda Realizada│  Perdido │
│          │               │                  │                │          │
│ [card]   │   [card]      │    [card]        │    [card]      │  [card]  │
│ [card]   │               │                  │                │          │
└──────────┴───────────────┴──────────────────┴────────────────┴──────────┘
```

### Alterações

**1. `src/pages/vendas/LeadsList.tsx`** — reescrever completamente

- Remover paginação (carregar todos os leads; se necessário, limitar a 1000 e adicionar filtros)
- Buscar todos os leads e agrupar por `novo_status`
- Layout horizontal com scroll: 5 colunas lado a lado, cada uma com header colorido (usando `statusColors` existente) e contagem
- Cada coluna é um `useDroppable` do `@dnd-kit/core`
- Cada card de lead é um `useDraggable`
- Ao soltar um lead em outra coluna: atualizar `novo_status` no Supabase e no estado local (otimista)
- Cards mostram: nome, telefone, cidade, data, atendente, valor (mesmo conteúdo atual, compacto)
- Manter busca no topo (filtra cards visíveis)
- Manter header, breadcrumb, botão voltar, partículas

**2. `src/components/vendas/LeadKanbanCard.tsx`** — novo componente

- Card compacto com nome, telefone, cidade, data, atendente
- Wrapped com `useDraggable` do `@dnd-kit/core`
- Estilo glassmorphism consistente com o projeto

**3. `src/components/vendas/LeadKanbanColumn.tsx`** — novo componente

- Coluna com header colorido, contagem de leads, área droppable
- Scroll vertical interno para muitos cards
- `useDroppable` do `@dnd-kit/core` com highlight ao arrastar sobre

### Tecnologia
- `@dnd-kit/core` (já instalado) — `DndContext`, `DragOverlay`, `useDraggable`, `useDroppable`, `PointerSensor`, `TouchSensor`
- Atualização otimista: mover card no estado local imediatamente, depois `supabase.from('elisaportas_leads').update({ novo_status }).eq('id', leadId)`

### Arquivos
- `src/pages/vendas/LeadsList.tsx` — reescrever
- `src/components/vendas/LeadKanbanCard.tsx` — criar
- `src/components/vendas/LeadKanbanColumn.tsx` — criar

