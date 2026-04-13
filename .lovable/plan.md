

## Plano: Adicionar coluna Lucro na lista de vendas pendentes

### O que será feito

Adicionar uma coluna "Lucro" no card exibindo `lucro_total` da venda, entre "Valor Total" e o botão "Criar Pedido".

### Alterações

**1. `src/hooks/useVendasPendentePedido.ts`**
- Adicionar `lucro_total` no select da query de vendas
- Adicionar campo `lucro_total: number | null` no tipo `VendaPendentePedido`
- Mapear `v.lucro_total` no retorno

**2. `src/components/pedidos/VendaPendentePedidoCard.tsx`**
- Atualizar `gridTemplateColumns` adicionando ~60px para a nova coluna
- Adicionar coluna após "Valor Total" mostrando:
  - Se `lucro_total > 0`: valor em verde
  - Se `lucro_total === 0` ou null: "—" em cinza
  - Tooltip com "Lucro da venda"

**3. `src/components/pedidos/VendaPendenteDetalhesSheet.tsx`**
- Adicionar info de lucro na downbar para consistência

### Detalhe técnico

O campo `lucro_total` já existe na tabela `vendas` (preenchido pelo faturamento). Vendas ainda não faturadas terão valor null — exibir "—".

