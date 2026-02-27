

# Corrigir valor total na geração de parcelas (contas a receber)

## Problema

A função `handleGerarParcelas` calcula o valor total das parcelas usando apenas `venda.valor_venda`, mas o valor real da venda inclui também o frete (`valor_frete`). Isso faz com que as parcelas geradas não cubram o valor total exibido (R$ 21.800,00).

## Solução

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Alterar a linha 150 para incluir o frete no cálculo:

```
// De:
const valorTotal = venda.valor_venda || 0;

// Para:
const valorTotal = (venda.valor_venda || 0) + (venda.valor_frete || 0);
```

Isso garante que as parcelas geradas (boleto, cartão, à vista, etc.) somem o valor completo da venda, incluindo o frete.

