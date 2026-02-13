

# Adicionar linha de totais na tabela de Produtos Fabrica

## O que sera feito
Adicionar uma linha fixa no rodape da tabela com os totais calculados de todas as colunas numericas visiveis.

## Totais exibidos

| Coluna | Calculo |
|--------|---------|
| Produto | Texto "TOTAL (X itens)" |
| Est. Min | Soma de `quantidade_ideal` |
| Est. Max | Soma de `quantidade_maxima` |
| Atual | Soma de `quantidade` |
| Preco/Un | Media ponderada ou "---" |
| Valor Total | Soma de `quantidade * custo_unitario` |

## Detalhes tecnicos

### Arquivo: `src/pages/direcao/estoque/ProdutosFabrica.tsx`

1. Calcular os totais a partir de `filteredProdutos`:
   - `totalIdeal` = soma de `quantidade_ideal`
   - `totalMaxima` = soma de `quantidade_maxima`
   - `totalAtual` = soma de `quantidade`
   - `totalValor` = soma de `quantidade * custo_unitario`

2. Adicionar um `TableFooter` (ja exportado pelo componente `Table`) apos o `TableBody`/`SortableContext`, dentro da `<Table>`, com uma unica `TableRow` contendo:
   - Celula vazia para o drag handle
   - Celula com texto bold "TOTAL (N itens)"
   - Celulas com os valores calculados, estilizados com `font-bold text-white`
   - Coluna Preco/Un exibira "---" (nao faz sentido somar precos unitarios)
   - Coluna Valor Total exibira a soma formatada com `formatCurrency`

3. Estilo da linha: fundo `bg-white/5` com borda superior `border-t border-white/20` para destaque visual, texto em branco com peso bold.

4. A linha de totais so aparece quando ha produtos na lista (`filteredProdutos.length > 0`).

