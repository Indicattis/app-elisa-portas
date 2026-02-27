

# Corrigir duplicação do frete na geração de parcelas

## Problema

O campo `valor_venda` no banco de dados (R$ 18.000) já inclui o valor do frete (R$ 600). Ao somar `valor_venda + valor_frete + valor_instalacao`, o frete é contado duas vezes, gerando parcelas de R$ 22.400 em vez de R$ 21.800.

## Solução

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Remover `valor_frete` do cálculo na linha 150:

```
// De:
const valorTotal = (venda.valor_venda || 0) + (venda.valor_frete || 0) + (venda.valor_instalacao || 0);

// Para:
const valorTotal = (venda.valor_venda || 0) + (venda.valor_instalacao || 0);
```

Resultado: R$ 18.000 + R$ 3.800 = R$ 21.800 (valor correto).

### Verificar outros locais com possível duplicação

Revisar também as outras exibições de "Valor Total" e "Valor a Receber" no mesmo arquivo para garantir consistência:
- Linha 554: card "Valor Total" soma `valor_venda + valor_credito + valor_frete` -- pode estar duplicando também
- Linha 910: "Valor a Receber" soma `valor_a_receber + valor_frete` -- pode estar duplicando também

Esses pontos serão verificados e corrigidos se necessário durante a implementação.

