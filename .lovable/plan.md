

## Plano: Botão "Concluir/Dispensar" na aba Pendente Faturamento

### Resumo
Adicionar um botão com ícone de "concluir" (CheckCircle) ao lado do botão "Criar Pedido" que marca a venda como dispensada de virar pedido, removendo-a da listagem.

### Mudanças

**1. Migration: adicionar coluna `pedido_dispensado` na tabela `vendas`**
- `ALTER TABLE vendas ADD COLUMN pedido_dispensado boolean NOT NULL DEFAULT false;`
- Vendas marcadas com `pedido_dispensado = true` serão filtradas no hook

**2. `src/hooks/useVendasPendentePedido.ts`**
- Adicionar filtro `.eq("pedido_dispensado", false)` na query ou filtrar no `.filter()` local

**3. `src/components/pedidos/VendaPendentePedidoCard.tsx`**
- Adicionar botão com ícone `CheckCircle` ao lado do botão "Criar Pedido"
- Ao clicar, abrir AlertDialog de confirmacao
- Na confirmacao, fazer `supabase.from("vendas").update({ pedido_dispensado: true }).eq("id", venda.id)` e invalidar queries
- Ajustar gridTemplateColumns para acomodar a nova coluna de acao (combinar ambos botoes numa mesma celula ou adicionar coluna extra)

### Arquivos alterados
- Nova migration SQL
- `src/hooks/useVendasPendentePedido.ts`
- `src/components/pedidos/VendaPendentePedidoCard.tsx`

