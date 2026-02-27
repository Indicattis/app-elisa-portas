
# Incluir valor da instalação na geração de parcelas

## Problema

Na função `handleGerarParcelas`, o valor total é calculado como `valor_venda + valor_frete`, mas não inclui `valor_instalacao`. Para esta venda: R$ 18.000 + R$ 600 = R$ 18.600, quando deveria ser R$ 18.000 + R$ 600 + R$ 3.800 = R$ 21.800.

## Solução

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Alterar a linha 150 para incluir a instalação:

```
// De:
const valorTotal = (venda.valor_venda || 0) + (venda.valor_frete || 0);

// Para:
const valorTotal = (venda.valor_venda || 0) + (venda.valor_frete || 0) + (venda.valor_instalacao || 0);
```

Isso garante que as parcelas geradas reflitam o valor real da venda (R$ 21.800).
