

# Corrigir dupla contagem de valor_instalacao

## Problema encontrado
Ao investigar os dados reais desta venda, descobri que o campo `valor_venda` na tabela `vendas` **ja inclui o valor de instalacao**. Isso acontece porque existe uma trigger no banco (`recalcular_valor_venda_com_frete`) que calcula:

```
valor_venda = SUM(valor_total dos produtos) + valor_frete
```

E o campo `valor_total` de cada produto ja inclui `valor_produto + valor_pintura + valor_instalacao`. Para esta venda:

- Produtos valor_total: 1400 + 1100 + 7300 + 8800 + 900 + 1200 = **20.700**
- Frete: **800**
- valor_venda (trigger): 20.700 + 800 = **21.500**
- valor_instalacao (campo separado, apenas informativo): **4.600**
- valor_credito: **250**

O total correto e: **valor_venda + valor_credito = 21.750** (exatamente o que o VendaResumo da pagina de edicao mostra).

A pagina de faturamento (`FaturamentoVendaMinimalista.tsx`) adiciona `valor_instalacao` por cima, gerando 26.350 -- o que e **dupla contagem**. As alteracoes feitas recentemente nas paginas da direcao tambem replicaram esse erro.

## Solucao

Reverter a adicao de `valor_instalacao` nos totalizadores, ja que esse valor ja esta embutido em `valor_venda`.

### 1. `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` (linha 570)
Remover `+ (venda.valor_instalacao || 0)` do calculo de "Valor Total":
- De: `(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)`
- Para: `(venda.valor_venda || 0) + (venda.valor_credito || 0)`

### 2. `src/pages/direcao/VendaDetalhesDirecao.tsx` (linha 277)
Reverter a alteracao recente:
- De: `(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)`
- Para: `(venda.valor_venda || 0) + (venda.valor_credito || 0)`

### 3. `src/pages/direcao/FaturamentoDirecao.tsx` (4 locais)
Reverter as alteracoes recentes nas linhas 392, 449, 493 e 796:
- De: `(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)`
- Para: `(venda.valor_venda || 0) + (venda.valor_credito || 0)`

Tambem nos totalizadores (linhas 449 e 493):
- De: `(v.valor_venda || 0) + (v.valor_credito || 0) + (v.valor_instalacao || 0) - (v.valor_frete || 0)`
- Para: `(v.valor_venda || 0) + (v.valor_credito || 0) - (v.valor_frete || 0)`

Isso alinha todas as paginas com a regra ja documentada: `valor_venda + valor_credito` (ou `valor_venda - valor_frete + valor_credito` para receita sem frete).
