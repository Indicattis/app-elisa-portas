

## Plano: Corrigir edição de colaboradores em /administrativo/rh-dp/colaboradores

### Problema identificado
O `EditColaboradorModal` invalida a query key `["colaboradores"]` após salvar, mas a página `ColaboradoresMinimalista` usa `["colaboradores-minimalista"]`. Isso faz com que a tabela não atualize após a edição.

### Correção

**Arquivo: `src/components/colaboradores/EditColaboradorModal.tsx`**
- Linha 115: Alterar `queryKey: ["colaboradores"]` para `queryKey: ["colaboradores-minimalista"]`
- Isso garante que a tabela recarregue após salvar alterações

Mudança de uma linha, sem impacto em outros componentes.

