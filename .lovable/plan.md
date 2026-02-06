

# Mostrar dimensoes da porta no header de agrupamento (downbar qualidade)

## Problema

O header do agrupamento por porta na downbar de qualidade mostra apenas "Porta 01", "Porta 02", etc., sem as dimensoes. Isso ocorre porque a query em `useOrdemProducao.ts` nao busca `largura` e `altura` dos `produtos_vendas`, entao o fallback no `OrdemDetalhesSheet.tsx` nao encontra as dimensoes.

A query de pintura (`useOrdemPintura.ts`) ja busca esses campos corretamente -- so falta corrigir no hook de producao.

## Solucao

### Arquivo: `src/hooks/useOrdemProducao.ts` (linha 109-115)

Adicionar `largura` e `altura` na sub-query de `produtos_vendas`:

De:
```
produtos:produtos_vendas(
  id,
  tipo_produto,
  cor_id,
  quantidade,
  catalogo_cores(nome, codigo_hex)
)
```

Para:
```
produtos:produtos_vendas(
  id,
  tipo_produto,
  cor_id,
  quantidade,
  largura,
  altura,
  catalogo_cores(nome, codigo_hex)
)
```

Isso e suficiente porque o `OrdemDetalhesSheet.tsx` ja tem a logica de fallback implementada (linhas 777-788) que busca as dimensoes em `ordem.pedido.produtos` quando nao estao na propria linha. So faltava o dado estar disponivel.

## Resultado

Os headers de agrupamento na downbar de qualidade passarao a mostrar:
- Porta 01 - 4,61m x 5,00m
- Porta 02 - 4,75m x 6,00m
- etc.

## Arquivo afetado
1. `src/hooks/useOrdemProducao.ts` (adicionar 2 campos na query)
