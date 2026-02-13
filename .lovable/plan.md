
# Substituir SKU por drag-and-drop para ordenar produtos da fabrica

## Resumo
Substituir a coluna SKU na tabela de produtos da fabrica por um botao de arraste (drag handle) que permite reordenar os itens. A nova ordem sera salva no banco de dados.

## Alteracoes necessarias

### 1. Adicionar coluna `ordem` na tabela `estoque`
- Criar coluna `ordem` do tipo `integer` com valor default `0`
- Inicializar os registros existentes com valores sequenciais baseados no nome

### 2. Alterar `src/hooks/useEstoque.ts`
- Trocar `.order("nome_produto")` por `.order("ordem", { ascending: true })`
- Adicionar funcao `reordenarProdutos` que recebe array de `{ id, ordem }` e faz update em batch na tabela `estoque`

### 3. Alterar `src/pages/direcao/estoque/ProdutosFabrica.tsx`
- Importar `DndContext`, `SortableContext`, `useSortable`, `closestCenter` do `@dnd-kit`
- Importar icone `GripVertical` do lucide-react
- Remover coluna "SKU" do header da tabela e substituir por coluna estreita sem titulo (para o drag handle)
- Extrair o conteudo de cada `TableRow` para um componente `SortableProductRow` definido **fora** do componente principal (seguindo o padrao de estabilidade de componentes)
- No `SortableProductRow`, usar `useSortable` e exibir o icone `GripVertical` na primeira celula como drag handle
- Envolver a `TableBody` com `DndContext` e `SortableContext`
- No `onDragEnd`, calcular a nova ordem e chamar `reordenarProdutos`
- Desabilitar drag-and-drop quando houver termo de busca ativo (pois a lista filtrada nao representa a ordem completa)

### Detalhes de implementacao
- O drag handle sera um icone `GripVertical` com estilo `cursor-grab text-white/30 hover:text-white/60`
- A ordenacao usara a mesma abordagem do `PedidosDraggableList` ja existente no projeto (com `@dnd-kit`)
- Ao arrastar, a linha tera opacidade reduzida e o overlay mostrara o nome do produto
