

# Corrigir card "Valor Total" para incluir instalação

## Problema

O card "Valor Total" na linha 554 calcula `valor_venda + valor_credito + valor_frete`, mas:
1. Não inclui `valor_instalacao` (R$ 3.800)
2. Soma `valor_frete` novamente, mesmo ele já estando dentro de `valor_venda`

Resultado atual: R$ 18.000 + R$ 0 + R$ 600 = R$ 18.600
Resultado esperado: R$ 18.000 + R$ 0 + R$ 3.800 = R$ 21.800

## Solução

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Alterar a linha 554:

```
// De:
(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_frete || 0)

// Para:
(venda.valor_venda || 0) + (venda.valor_credito || 0) + (venda.valor_instalacao || 0)
```

Isso remove a duplicação do frete e inclui o valor da instalação, resultando no total correto de R$ 21.800.

