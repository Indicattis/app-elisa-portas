

# Plano: Padronizar Cálculo de Valor SEM Frete

## Objetivo

Alterar o cálculo do valor das vendas em `/vendas/minhas-vendas` para excluir o frete, seguindo o mesmo padrão da página `/direcao/vendas`.

---

## Alterações Necessárias

### Arquivo: `src/pages/vendas/MinhasVendas.tsx`

#### 1. Cálculo do Valor Total (linhas 179-181)

**Atual:**
```typescript
const valorTotal = vendasFiltradas.reduce((acc, v) => {
  return acc + (v.valor_venda || 0) + (v.valor_credito || 0);
}, 0);
```

**Novo:**
```typescript
const valorTotal = vendasFiltradas.reduce((acc, v) => {
  return acc + (v.valor_venda || 0) - (v.valor_frete || 0) + (v.valor_credito || 0);
}, 0);
```

#### 2. Exibição na Célula da Tabela (linha 305)

**Atual:**
```typescript
case 'valor':
  return <span className="font-semibold">{formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}</span>;
```

**Novo:**
```typescript
case 'valor':
  const valorSemFrete = (venda.valor_venda || 0) - (venda.valor_frete || 0) + (venda.valor_credito || 0);
  return <span className="font-semibold">{formatCurrency(valorSemFrete)}</span>;
```

---

## Fórmula Padronizada

| Página | Fórmula |
|--------|---------|
| `/direcao/vendas` | `valor_venda - valor_frete + valor_credito` |
| `/vendas/minhas-vendas` | `valor_venda - valor_frete + valor_credito` ✓ |

---

## Resultado Esperado

1. O card "Valor Total" exibirá a soma sem incluir fretes
2. Cada linha da tabela mostrará o valor sem frete
3. Os valores do vendedor Magno serão iguais em ambas as páginas

