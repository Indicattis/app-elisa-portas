
# Correção: Inconsistência de Valores na Tela de Faturamento

## Problema Identificado

O sistema tem uma confusão entre valores TOTAIS e valores POR UNIDADE:

| Campo | Valor no Banco | Interpretação Atual | Problema |
|-------|----------------|---------------------|----------|
| `valor_total` | 600, 900, 705 | Tratado como unitário | Mostra "Valor Unit." na tabela e multiplica por qtd |
| `lucro_item` | 0 | Tratado como por unidade | Multiplica por quantidade nos cálculos |
| `custo_producao` | 0 | Tratado como por unidade | Calculado como `valor_total - lucro` (mistura!) |

**Resultado:** A tabela mostra R$ 24.000,00 (600 x 40) quando deveria ser R$ 600,00.

## Solução

Padronizar tudo para valores TOTAIS da linha (não por unidade). Isso simplifica os cálculos e evita confusão.

## Alterações Técnicas

### 1. `src/components/vendas/FaturamentoProdutosTable.tsx`

**Corrigir exibição (linhas 72, 94, 99-100, 115):**

```typescript
// ANTES:
const valorTotalLinha = produto.valor_total * produto.quantidade;

// DEPOIS:
const valorTotalLinha = produto.valor_total; // Já é o total
const valorUnitario = produto.quantidade > 0 ? produto.valor_total / produto.quantidade : 0;

// Coluna "Valor Unit." - linha 94
// ANTES:
R$ {produto.valor_total.toFixed(2)}
// DEPOIS:
R$ {valorUnitario.toFixed(2)}

// Coluna "Valor Total" - linha 100 (sem mudança, já usa valorTotalLinha)

// Badge de lucro - linha 115
// ANTES:
R$ {(produto.lucro_item! * produto.quantidade).toFixed(2)}
// DEPOIS:
R$ {produto.lucro_item!.toFixed(2)} // Já é o total
```

### 2. `src/pages/FaturamentoEdit.tsx`

**Corrigir cálculos de totais (linhas 107-112, 182-183):**

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
  acc + (p.custo_producao || 0), 0  // Já é total
);
const lucroTotal = produtos.reduce((acc, p) => 
  acc + (p.lucro_item || 0), 0  // Já é total
);

// Mesma correção para linhas 182-183
const totalLucro = produtos?.reduce((acc, p) => acc + (p.lucro_item || 0), 0) || 0;
const totalCusto = produtos?.reduce((acc, p) => acc + (p.custo_producao || 0), 0) || 0;
```

### 3. `src/components/vendas/LucroItemModal.tsx`

**Atualizar validação e exibição:**

O modal já usa `valor_total` diretamente (600, 900, 705), que é correto. O lucro máximo permitido é o valor total da linha.

**Adicionar clareza na UI (opcional):**

```typescript
// Adicionar info do valor unitário para contexto
const valorUnitario = produto.quantidade > 0 ? valorTotal / produto.quantidade : 0;

// No JSX, adicionar:
<div className="flex justify-between items-center">
  <span className="text-sm text-muted-foreground">Valor Unitário:</span>
  <span className="text-sm">R$ {valorUnitario.toFixed(2)}</span>
</div>
```

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `FaturamentoProdutosTable.tsx` | Calcular valor unitário dividindo, não multiplicar total por qtd |
| `FaturamentoEdit.tsx` | Remover multiplicação por quantidade nos totais |
| `LucroItemModal.tsx` | Adicionar exibição do valor unitário para clareza |

## Resultado Esperado

**Tabela de produtos:**
| Produto | Valor Unit. | Qtd | Valor Total |
|---------|-------------|-----|-------------|
| Meia cana micro | R$ 15,00 | 40 | R$ 600,00 |
| Meia cana micro | R$ 15,00 | 60 | R$ 900,00 |
| Meia cana micro | R$ 15,00 | 47 | R$ 705,00 |
| **Total** | | | **R$ 2.205,00** |

O lucro máximo que pode ser informado por produto será R$ 600, R$ 900, R$ 705 respectivamente, que são os valores totais corretos de cada linha.
