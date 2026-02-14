
# Ocultar dados de estoque para itens nao conferidos

## Resumo
Itens com `conferir_estoque = false` nao devem exibir quantidade atual, estoque minimo, estoque maximo e valor em estoque. Essas celulas ficam vazias (exibindo "---" ou em branco), e os totais do rodape tambem devem excluir esses itens do calculo.

## Alteracoes

### 1. Componente `SortableProductRow` (linhas 54-133)
- Nas celulas de **Est. Min** (linha 100), **Est. Max** (linha 102), **Atual** (linha 105-114) e **Valor Total** (linha 128-130): exibir "---" quando `produto.conferir_estoque` for `false`
- O **Preco/Un** continua visivel independentemente do status

### 2. Calculo dos totais (linhas 229-242)
- Filtrar apenas produtos com `conferir_estoque === true` para calcular os totais de `ideal`, `maxima`, `atual`, `valor`, `estoqueBaixo` e `estoqueExcesso`
- Isso garante que os indicadores no topo (Valor Estoque, Estoque Baixo, Em Excesso) e o rodape reflitam somente itens conferidos

### 3. Celulas do rodape (linhas 706-721)
- Nenhuma alteracao estrutural necessaria, pois os totais ja serao recalculados corretamente

## Detalhes tecnicos

No `SortableProductRow`, a logica sera:
```
conferir_estoque ? valor : "---"
```

No calculo de totais:
```
const produtosConferidos = filteredProdutos.filter(p => p.conferir_estoque);
```
E usar `produtosConferidos` em vez de `filteredProdutos` no `reduce` e nos filtros de estoque baixo/excesso.

### Arquivo alterado
- `src/pages/direcao/estoque/ProdutosFabrica.tsx`
