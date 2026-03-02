

# Corrigir dupla contagem no "Total Geral" e "Valor a Receber"

## Problema

Dois campos na pagina de faturamento administrativo (`FaturamentoVendaMinimalista.tsx`) estao com dupla contagem:

### 1. Total Geral (linha 825-830)
Formula atual:
```
SUM(produto.valor_total) + valorInstalacao + valor_frete
```
Como cada `produto.valor_total` ja inclui o valor de instalacao do produto, somar `valorInstalacao` novamente causa dupla contagem. O correto e:
```
SUM(produto.valor_total) + valor_frete
```

### 2. Valor a Receber (linha 926)
Formula atual:
```
valor_a_receber + valor_frete
```
O `valor_a_receber` e informado pelo usuario com base no valor total da venda (que ja inclui frete). Somar o frete novamente causa dupla contagem. O correto e:
```
valor_a_receber
```

## Alteracoes

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

**Linha 826-830** - Remover `valorInstalacao` do Total Geral:
```typescript
// De:
(produtos?.reduce(...) || 0) + (valorInstalacao || 0) + (venda.valor_frete || 0)
// Para:
(produtos?.reduce(...) || 0) + (venda.valor_frete || 0)
```

**Linha 926** - Remover `valor_frete` do Valor a Receber:
```typescript
// De:
formatCurrency((venda.valor_a_receber || 0) + (venda.valor_frete || 0))
// Para:
formatCurrency(venda.valor_a_receber || 0)
```

