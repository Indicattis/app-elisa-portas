

## Diagnóstico: Faturamento incorreto na seção CAC por Canal Pago

### Problema encontrado

A coluna `faturamento` na tabela `produtos_vendas` é do tipo **boolean** (indica se o produto foi faturado ou não), e **não** um valor monetário. O código atual faz:

```typescript
produtos_vendas(faturamento)
// ...
venda.produtos_vendas?.reduce((sum, p) => sum + (p.faturamento || 0), 0)
```

Como `true` vira `1` em JavaScript, o "faturamento" exibido é simplesmente a **contagem de produtos faturados** (17 para Google, 8 para Meta), não o valor real.

### Correção

**Arquivo:** `src/pages/marketing/PerformanceMinimalista.tsx`

1. **Alterar a query** (linha ~466): trocar `produtos_vendas(faturamento)` por `produtos_vendas(valor_total, faturamento)` para buscar o valor monetário real junto com o flag de faturamento.

2. **Alterar o cálculo** (linhas ~513-520): somar `valor_total` dos produtos que têm `faturamento = true`, em vez de somar o campo booleano:

```typescript
vendasDoCanal.forEach((venda: any) => {
  const produtosFaturados = venda.produtos_vendas?.filter((p: any) => p.faturamento === true) || [];
  if (produtosFaturados.length > 0) {
    vendasFaturadas++;
    faturamento += produtosFaturados.reduce((sum: number, p: any) => sum + (p.valor_total || 0), 0);
  } else {
    vendasPendentes++;
  }
});
```

Isso garante que o faturamento exibido seja a soma dos `valor_total` dos produtos efetivamente faturados.

