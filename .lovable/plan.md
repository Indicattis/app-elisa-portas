
# Correção: FaturamentoVendaMinimalista - Mesma Inconsistência de Valores

## Problema

O arquivo `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` está com a **mesma lógica incorreta** que já foi corrigida em `FaturamentoEdit.tsx` e `FaturamentoProdutosTable.tsx`. Este é o componente real usado na rota `/administrativo/financeiro/faturamento/:id`.

Problemas específicos:
- **Linha 497**: `valorTotalLinha = produto.valor_total * produto.quantidade` multiplica quando não deveria
- **Linha 519**: Mostra `produto.valor_total` como "Valor Unitário" (600) quando deveria dividir
- **Linha 535**: Multiplica `lucro_item * quantidade` no badge
- **Linhas 171-176**: Calcula `custoTotal` e `lucroTotal` multiplicando por quantidade
- **Linha 238**: Calcula `lucroProdutos` multiplicando por quantidade

## Solução

Aplicar as mesmas correções já feitas nos outros componentes.

## Alterações Técnicas

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

**1. Corrigir cálculos em executarFaturamento (linhas 171-176):**

```typescript
// ANTES:
const custoTotal = produtos.reduce((acc, p) => 
  acc + ((p.custo_producao || 0) * p.quantidade), 0
);
const lucroTotal = produtos.reduce((acc, p) => 
  acc + ((p.lucro_item || 0) * p.quantidade), 0
);

// DEPOIS:
const custoTotal = produtos.reduce((acc, p) => 
  acc + (p.custo_producao || 0), 0  // valor já é o total da linha
);
const lucroTotal = produtos.reduce((acc, p) => 
  acc + (p.lucro_item || 0), 0  // valor já é o total da linha
);
```

**2. Corrigir cálculo de lucroProdutos (linha 238):**

```typescript
// ANTES:
const lucroProdutos = produtos?.reduce((acc, p) => acc + ((p.lucro_item || 0) * p.quantidade), 0) || 0;

// DEPOIS:
const lucroProdutos = produtos?.reduce((acc, p) => acc + (p.lucro_item || 0), 0) || 0;
```

**3. Corrigir exibição na tabela (linhas 497-535):**

```typescript
// ANTES (linha 497):
const valorTotalLinha = produto.valor_total * produto.quantidade;

// DEPOIS:
const valorTotalLinha = produto.valor_total; // Já é o total da linha
const valorUnitario = produto.quantidade > 0 ? produto.valor_total / produto.quantidade : 0;

// ANTES (linha 519 - coluna "Valor Unit."):
{formatCurrency(produto.valor_total)}

// DEPOIS:
{formatCurrency(valorUnitario)}

// ANTES (linha 535 - badge de lucro):
{formatCurrency(produto.lucro_item! * produto.quantidade)}

// DEPOIS:
{formatCurrency(produto.lucro_item!)}
```

## Resultado Esperado

**Tabela após correção:**
| Tipo | Produto | Valor Unit. | Qtd | Valor Total | Lucro |
|------|---------|-------------|-----|-------------|-------|
| Adicional | Meia cana micro | R$ 15,00 | 40 | R$ 600,00 | Pendente |
| Adicional | Meia cana micro | R$ 15,00 | 60 | R$ 900,00 | Pendente |
| Adicional | Meia cana micro | R$ 15,00 | 47 | R$ 705,00 | Pendente |

O lucro máximo que pode ser informado por produto será R$ 600,00, R$ 900,00 e R$ 705,00 (valores totais corretos de cada linha).

A soma total será R$ 2.205,00 (valor correto da venda), não R$ 111.135,00.
