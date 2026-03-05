

# Adicionar colunas de Lucro e % Margem na tabela de Produtos

## Alterações em `FaturamentoVendaMinimalista.tsx`

### 1. Adicionar 2 novas colunas no header (após "Valor Total")
- **Lucro** (text-right) — valor numérico do lucro do item
- **Margem %** (text-right) — percentual `(lucro / valor_total) * 100`

A coluna existente "Lucro" (que mostra badges Faturado/Pendente) será renomeada para **Status** para evitar confusão.

### 2. Adicionar células nas linhas de produtos
- Coluna Lucro: `formatCurrency(produto.lucro_item)` ou "-" se pendente
- Coluna Margem: `((lucro_item / valor_total) * 100).toFixed(1)%` ou "-"

### 3. Ajustar colSpans nas linhas totais (agora 11 colunas em vez de 9)
- **Frete**: `colSpan={8}` + valor na coluna Valor Total + `colSpan={3}` para o resto
- **Crédito**: idem
- **Total Geral**: `colSpan={8}` + valor total + lucro total + margem total + ações
- **Instalação**: adicionar células de lucro e margem (30%)
- **Total Lucro**: ajustar colSpans

### Arquivo afetado
- `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

