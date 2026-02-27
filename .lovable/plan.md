

# Corrigir colunas não aparecendo em /administrativo/financeiro/faturamento/vendas

## Problema

O hook `useColumnConfig` carrega a configuração de colunas visíveis do `localStorage`. Se a configuração salva tiver uma lista de colunas visíveis vazia (por exemplo, se o usuário desmarcou todas as colunas, ou se houve uma inconsistência nos dados salvos), a tabela fica sem nenhuma coluna.

## Solução

Duas alterações no hook `useColumnConfig.ts`:

1. **Validação ao carregar**: Após restaurar `config.visible` do localStorage, verificar se o resultado teria pelo menos uma coluna visível. Se não, usar os padrões.
2. **Proteção ao desmarcar**: No `toggleColumn`, impedir que o usuário desmarque a última coluna visível (manter pelo menos 1 coluna sempre visível).

### Arquivo: `src/hooks/useColumnConfig.ts`

- Na lógica do `useEffect` (linhas 21-48): Após `setVisibleIds(new Set(config.visible))`, adicionar validação — se `config.visible` resultar em 0 colunas válidas (interseção com `defaultColumns`), usar os defaults.
- Na função `toggleColumn` (linhas 63-73): Antes de deletar um ID, verificar se `newSet.size > 1`. Se for a última coluna visível, não permitir a remoção.

