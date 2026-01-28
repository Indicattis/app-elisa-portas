
## Plano: Alinhar Cálculo de Valor em Minhas Vendas com Direção

### Problema Identificado

As fórmulas de cálculo do "Valor" estão diferentes entre as duas páginas:

| Página | Fórmula Atual |
|--------|---------------|
| `/direcao/vendas` | `valor_venda + valor_credito` |
| `/vendas/minhas-vendas` | `valor_venda - descontos + valor_credito` |

### Correção Necessária

Alinhar a coluna "Valor" em `/vendas/minhas-vendas` com a fórmula de `/direcao/vendas`.

**Arquivo:** `src/pages/vendas/MinhasVendas.tsx`

#### 1. Atualizar a coluna "Valor" (linhas 299-302)

```typescript
// ANTES
case 'valor':
  const descontoTotalValor = venda.produtos_vendas?.reduce((acc, p) => acc + (p.desconto_valor || 0), 0) || 0;
  const valorAjustado = (venda.valor_venda || 0) - descontoTotalValor + (venda.valor_credito || 0);
  return <span className="font-semibold">{formatCurrency(valorAjustado)}</span>;

// DEPOIS (igual a VendasDirecao)
case 'valor':
  return <span className="font-semibold">{formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}</span>;
```

#### 2. Atualizar o card "Valor Total" (linhas 174-178)

```typescript
// ANTES
const valorTotal = vendasFiltradas.reduce((acc, v) => {
  const totalDesconto = v.produtos_vendas?.reduce((sum, p) => sum + (p.desconto_valor || 0), 0) || 0;
  const valorLiquido = (v.valor_venda || 0) - (v.valor_frete || 0) + (v.valor_credito || 0) - totalDesconto;
  return acc + valorLiquido;
}, 0);

// DEPOIS (consistente com a coluna)
const valorTotal = vendasFiltradas.reduce((acc, v) => {
  return acc + (v.valor_venda || 0) + (v.valor_credito || 0);
}, 0);
```

### Resumo das Alterações

| Local | Antes | Depois |
|-------|-------|--------|
| Coluna "Valor" | `valor_venda - descontos + credito` | `valor_venda + credito` |
| Card "Valor Total" | `valor_venda - frete + credito - descontos` | `valor_venda + credito` |

### Resultado Esperado

- Valores na coluna "Valor" em `/vendas/minhas-vendas` serão idênticos aos de `/direcao/vendas`
- Card de resumo "Valor Total" será consistente com os valores das linhas
