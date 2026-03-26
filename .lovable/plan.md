

## Plano: Substituir Kanban por listagem simples de leads

### O que será feito
Reescrever `src/pages/vendas/LeadsList.tsx` removendo todo o Kanban (drag-and-drop, colunas, cards) e substituindo por uma tabela/lista simples com as colunas: Nome, Telefone, Cidade, Canal, Data, Status, Valor, Atendente.

### Alterações

**1. `src/pages/vendas/LeadsList.tsx`** — Reescrita completa:
- Remover imports de `@dnd-kit/core`, `LeadKanbanColumn`, `LeadKanbanCard`
- Remover lógica de drag (sensors, handleDragStart, handleDragEnd, groupedLeads, activeLead)
- Manter: fetch de leads, busca, atendentesMap, layout base (fundo escuro, breadcrumb, botão voltar, particles)
- Renderizar uma tabela com `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` do shadcn
- Cada linha mostra: nome, telefone, cidade, canal_aquisicao, data_envio formatada, status com badge colorido, valor_orcamento, nome do atendente
- Botão WhatsApp em cada linha

**2. Arquivos não mais necessários** (podem ser mantidos ou removidos):
- `src/components/vendas/LeadKanbanColumn.tsx`
- `src/components/vendas/LeadKanbanCard.tsx`

### Arquivo alterado
- `src/pages/vendas/LeadsList.tsx` (reescrita)

