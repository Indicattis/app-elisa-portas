
# Alterar cálculo automático de lucro para pintura epóxi

## Problema
Atualmente, o lucro automático de produtos "pintura_epoxi" é calculado como 30% do valor total (`valor_total * 0.30`). O correto deve ser `(altura * largura) * 25`.

## Solução

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Alterar as linhas 274-276 no useEffect de auto-faturamento:

```
// De:
const lucro30percent = produto.valor_total * 0.30;
const custoCalculado = produto.valor_total - lucro30percent;

// Para:
const lucroPintura = ((produto.altura || 0) * (produto.largura || 0)) * 25;
const custoCalculado = produto.valor_total - lucroPintura;
```

O custo de produção continuará sendo calculado como `valor_total - lucro`, mantendo a lógica existente. A única mudança é a fórmula do lucro: de 30% do valor para (altura x largura) x 25.
