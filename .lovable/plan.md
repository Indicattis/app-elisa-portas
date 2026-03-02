
# Corrigir discrepancia de "Valor Total" entre paginas

## Problema
A pagina `/direcao/vendas/:id` exibe "Valor Total" como `valor_venda + valor_credito` = R$ 21.750,00, enquanto a pagina `/administrativo/financeiro/faturamento/:id` exibe "Valor Total" como `valor_venda + valor_credito + valor_instalacao` = R$ 26.350,00.

A diferenca de R$ 4.600,00 corresponde ao valor de instalacao, que so e somado no faturamento.

## Causa raiz
No arquivo `src/pages/direcao/VendaDetalhesDirecao.tsx` (linha 277), a formula do "Valor Total" nao inclui `valor_instalacao`:
```
valor_venda + valor_credito
```

No arquivo `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` (linha 570), a formula esta completa:
```
valor_venda + valor_credito + valor_instalacao
```

## Solucao

### Arquivo: `src/pages/direcao/VendaDetalhesDirecao.tsx`

**Linha 277:** Adicionar `valor_instalacao` ao calculo do "Valor Total" para manter consistencia com o faturamento:

De:
```
(venda.valor_venda || 0) + (venda.valor_credito || 0)
```
Para:
```
(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)
```

Isso alinha ambas as paginas com a regra de negocio documentada: `valor_venda + valor_instalacao + valor_credito`. A pagina da direcao ja exibe a instalacao separadamente em seu proprio card (linha 293), mas o totalizador precisa refletir o valor completo.
