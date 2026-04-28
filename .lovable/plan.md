# Catálogo: visualização em lista + ordenação drag-and-drop

## O que será feito

Em `/marketing/catalogo`:

1. **Toggle de visualização** (Grid / Lista) no header, ao lado dos botões "Cores" e "Novo Produto".
2. **Visualização em lista** — linhas compactas com: handle de arraste, miniatura, nome, categoria, preço, estoque, badge de destaque. Clique na linha abre a edição (mesmo comportamento do card).
3. **Drag-and-drop para ordenar** — disponível em ambas as visualizações (grid e lista), persistindo a nova ordem no banco.

## Mudanças técnicas

### Banco de dados
- Migration: adicionar coluna `ordem INTEGER` em `vendas_catalogo` (default 0, indexada).
- Backfill inicial baseado em `destaque DESC, nome_produto ASC` para preservar a ordem atual.

### Hook `useVendasCatalogo.ts`
- Ordenar query por `ordem ASC` (em vez de `destaque DESC, nome_produto`).
- Nova mutation `reordenarProdutos(ids: string[])` que atualiza `ordem` em lote (uma chamada upsert ou `update` por id).

### Página `src/pages/vendas/Catalogo.tsx`
- Estado `viewMode: 'grid' | 'list'` persistido em `localStorage`.
- Toggle no `headerActions` (ícones `LayoutGrid` / `List`).
- Renderização condicional: grid existente ou nova lista.
- Integração com `@dnd-kit/core` + `@dnd-kit/sortable` (já no projeto, se não, instalar) para reordenar tanto em grid quanto em lista. Cada item recebe handle de drag; ao soltar, dispara `reordenarProdutos` com a nova ordem.
- Drag desabilitado quando há filtro de busca ou categoria ativo (para evitar reordenação parcial inconsistente). Mostrar dica visual nesse estado.

### Estética
- Mantém o glassmorphism unificado (bg-white/5, backdrop-blur-xl, border-white/10, paleta blue/white).
- Lista: linhas com `hover:bg-white/10`, handle `GripVertical` à esquerda discreto.

## Arquivos afetados
- `supabase/migrations/<novo>.sql` (nova coluna + backfill)
- `src/hooks/useVendasCatalogo.ts` (order by + mutation reordenar)
- `src/pages/vendas/Catalogo.tsx` (toggle, lista, dnd)
- `package.json` (apenas se `@dnd-kit/*` ainda não estiver instalado)
