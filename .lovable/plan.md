

# Corrigir drag-and-drop na pagina de Produtos Fabrica

## Problemas identificados

### 1. Ordem nao muda apos soltar o item
O `handleDragEnd` busca os indices em `produtos` (lista completa do hook), mas o `SortableContext` recebe `filteredProdutos`. Alem disso, nao ha atualizacao otimista da UI -- o componente espera o refetch do React Query, que pode nao refletir a mudanca imediatamente. A lista precisa ser atualizada localmente antes de salvar no banco.

### 2. Item nao acompanha o scroll
O `@dnd-kit` tem auto-scroll habilitado por padrao, porem o container de scroll pode nao ser detectado corretamente. O `DragOverlay` precisa ser renderizado via `createPortal` no `document.body` para ficar fora do container com overflow e acompanhar o scroll corretamente (mesmo padrao usado em `PedidosDraggableList.tsx`).

## Alteracoes

### Arquivo: `src/pages/direcao/estoque/ProdutosFabrica.tsx`

1. **Adicionar estado local para a lista ordenada** -- usar `useState` + `useEffect` para manter uma copia local de `produtos` que e atualizada otimisticamente no `onDragEnd` antes de salvar no banco.

2. **Renderizar DragOverlay via createPortal** -- importar `createPortal` de `react-dom` e renderizar o `DragOverlay` dentro de `createPortal(..., document.body)`. Isso garante que o overlay fique no topo do DOM e acompanhe o cursor/scroll corretamente.

3. **Adicionar modifier `restrictToWindowEdges`** -- importar de `@dnd-kit/modifiers` e aplicar ao `DragOverlay` para evitar que o item saia da tela (seguindo o padrao de `PedidosDraggableList`).

4. **Corrigir logica do handleDragEnd** -- usar a lista local (`localProdutos`) em vez de `produtos` para calcular indices e fazer a reordenacao. Atualizar o estado local imediatamente (otimista) e depois chamar `reordenarProdutos`.

5. **Filtrar a partir da lista local** -- `filteredProdutos` deve derivar de `localProdutos` em vez de `produtos`.

### Resumo das mudancas tecnicas

```text
Antes:
  produtos (react-query) --> filteredProdutos --> SortableContext
  handleDragEnd --> arrayMove(produtos) --> reordenarProdutos --> invalidateQueries --> refetch

Depois:
  produtos (react-query) --> localProdutos (estado local, sync via useEffect)
  localProdutos --> filteredProdutos --> SortableContext
  handleDragEnd --> arrayMove(localProdutos) --> setLocalProdutos (otimista) --> reordenarProdutos
  DragOverlay renderizado via createPortal no document.body
```

### Arquivo unico editado
- `src/pages/direcao/estoque/ProdutosFabrica.tsx`

