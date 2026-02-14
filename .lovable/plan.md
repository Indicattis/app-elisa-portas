
# Adicionar colunas "Pedidos" e "Conferir" na tabela de Produtos Fabrica

## Resumo
Adicionar duas novas colunas na tabela de produtos da fabrica:
1. **Qtd Pedidos** - Quantidade de pedidos de producao que usam esse item (contagem via `pedido_linhas.estoque_id`)
2. **Conferir** - Checkbox rapido para ativar/desativar o campo `conferir_estoque` diretamente na listagem

## Detalhes Tecnicos

### 1. Buscar contagem de pedidos por produto
- Criar uma query separada (ou inline no componente) que faz `SELECT estoque_id, COUNT(DISTINCT pedido_id) FROM pedido_linhas GROUP BY estoque_id` para obter a contagem de pedidos por item de estoque
- Usar um `useQuery` adicional no componente `ProdutosFabrica.tsx` para buscar esses dados
- Exibir o numero em uma nova coluna "Pedidos" na tabela

### 2. Checkbox "Conferir"
- Usar o componente `Checkbox` existente (`@/components/ui/checkbox`)
- Ao clicar, chamar `supabase.from("estoque").update({ conferir_estoque: !valor_atual }).eq("id", produto.id)` diretamente
- Invalidar a query de estoque apos a atualizacao para refletir o estado atualizado
- Nao exigir confirmacao - acao imediata ao clicar

### 3. Alteracoes no arquivo `src/pages/direcao/estoque/ProdutosFabrica.tsx`
- Importar `Checkbox` de `@/components/ui/checkbox`
- Importar `supabase` e `useQueryClient` (ja disponivel via `useEstoque`)
- Adicionar `useQuery` para buscar contagem de pedidos
- Adicionar props `pedidosCount` e `onToggleConferir` ao `SortableProductRow`
- Adicionar 2 novas colunas no `TableHeader`: "Pedidos" e "Conferir"
- Adicionar 2 novas celulas no `SortableProductRow`
- Atualizar todos os `colSpan` de 8 para 10
- Adicionar 2 celulas extras no `TableFooter`

### 4. Nenhuma alteracao de banco de dados necessaria
- O campo `conferir_estoque` ja existe na tabela `estoque`
- A tabela `pedido_linhas` ja tem a coluna `estoque_id` para a contagem
