

# Adicionar campo "Lucro" na Tabela de Preços

## O que será feito

Adicionar um campo `lucro` (valor numérico) em cada configuração de porta na tabela de preços, permitindo informar o lucro esperado por configuração. O valor aparecerá na tabela listagem e no modal de criação/edição.

## Alterações

### 1. Migração SQL
Adicionar coluna `lucro` (numeric, default 0) na tabela `tabela_precos_portas`.

### 2. Hook `useTabelaPrecos.ts`
- Adicionar `lucro` nas interfaces `ItemTabelaPreco` e `ItemTabelaPrecoInput`.

### 3. Modal `ItemModal.tsx`
- Adicionar campo "Lucro" no formulário, na mesma linha dos valores (grid de 3 colunas vira 4, ou adicionar numa nova linha).

### 4. Página `TabelaPrecos.tsx`
- Adicionar coluna "Lucro" na tabela entre "Total" e "Ações".
- Mostrar lucro também na pesquisa rápida de orçamento.

### 5. `BulkUploadTabelaPrecos.tsx`
- Suportar coluna `lucro` no upload em massa (se aplicável).

## Arquivos afetados
- Migração SQL (nova coluna)
- `src/hooks/useTabelaPrecos.ts`
- `src/components/tabela-precos/ItemModal.tsx`
- `src/pages/TabelaPrecos.tsx`
- `src/components/tabela-precos/BulkUploadTabelaPrecos.tsx`

