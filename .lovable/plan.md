
# Remover coluna Status da tabela de Despesas

## Alteração

Remover a coluna "Status" (com o Switch ativo/inativo) da tabela principal de tipos de custos em `src/pages/direcao/DREDespesasDirecao.tsx`:

- **Linha 159**: Remover `<TableHead>Status</TableHead>`
- **Linha 174**: Remover `<TableCell>` com o Switch
- **Linha 165**: Ajustar `colSpan` de 7 para 6

### Arquivo alterado
- `src/pages/direcao/DREDespesasDirecao.tsx`
