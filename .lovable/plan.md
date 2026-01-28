

## Plano: Corrigir Cálculo do Valor Total com Desconto e Acréscimo

### Problema Identificado

Na página `/vendas/minhas-vendas`, a coluna **Valor** exibe apenas o `valor_venda` bruto, sem considerar:
- **Descontos** aplicados nos produtos
- **Acréscimos** (valor_credito) da venda

### Comportamento Atual vs Esperado

| Situação | Atual | Esperado |
|----------|-------|----------|
| Venda R$ 1.000 com desconto R$ 100 | R$ 1.000 | R$ 900 |
| Venda R$ 1.000 com acréscimo R$ 50 | R$ 1.000 | R$ 1.050 |
| Venda R$ 1.000 com desconto R$ 100 e acréscimo R$ 50 | R$ 1.000 | R$ 950 |

### Fórmula do Valor Ajustado

```text
Valor Ajustado = valor_venda - totalDesconto + valorCredito
```

Onde:
- `totalDesconto` = soma de `produtos_vendas.desconto_valor`
- `valorCredito` = `valor_credito` (acréscimo)

### Alterações Necessárias

**Arquivo:** `src/pages/vendas/MinhasVendas.tsx`

#### 1. Atualizar a coluna "Valor" (linha ~298-299)

```typescript
// Antes
case 'valor':
  return <span className="font-semibold">{formatCurrency(venda.valor_venda || 0)}</span>;

// Depois
case 'valor':
  const descontoTotal = venda.produtos_vendas?.reduce((acc, p) => acc + (p.desconto_valor || 0), 0) || 0;
  const valorAjustado = (venda.valor_venda || 0) - descontoTotal + (venda.valor_credito || 0);
  return <span className="font-semibold">{formatCurrency(valorAjustado)}</span>;
```

#### 2. Atualizar o card "Valor Total" (linha ~174-177)

O cálculo do card de estatísticas também precisa incluir o desconto:

```typescript
// Antes
const valorTotal = vendasFiltradas.reduce((acc, v) => {
  const valorLiquido = (v.valor_venda || 0) - (v.valor_frete || 0) + (v.valor_credito || 0);
  return acc + valorLiquido;
}, 0);

// Depois
const valorTotal = vendasFiltradas.reduce((acc, v) => {
  const totalDesconto = v.produtos_vendas?.reduce((sum, p) => sum + (p.desconto_valor || 0), 0) || 0;
  const valorLiquido = (v.valor_venda || 0) - (v.valor_frete || 0) + (v.valor_credito || 0) - totalDesconto;
  return acc + valorLiquido;
}, 0);
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/vendas/MinhasVendas.tsx` | Atualizar cálculo na coluna "Valor" e no card "Valor Total" |

### Resultado Esperado

- Coluna **Valor** exibirá o valor ajustado (com desconto subtraído e acréscimo adicionado)
- Card **Valor Total** incluirá os descontos no cálculo geral
- Consistência entre o valor individual de cada venda e o total exibido

