

## Plano: Adicionar "Finalizar Direto" na aba Pend. Faturamento

### O que será feito
Adicionar um botão "Finalizar Direto" (ícone CheckCircle2, estilo emerald) no card de vendas em modo `faturamento`, que abre um Dialog detalhado (igual ao padrão do PedidoCard) informando as consequências antes de enviar a venda para "Arquivo Morto" (marcar `pedido_dispensado = true`).

### Alterações

**1. `src/components/pedidos/VendaPendentePedidoCard.tsx`**
- Adicionar estado `showFinalizarDireto` e `isFinalizandoDireto`
- Adicionar botão emerald (CheckCircle2) no grid do modo `faturamento`, ao lado do botão amarelo existente
- Ajustar grid columns para acomodar o novo botão (adicionar mais uma coluna de 30px)
- Adicionar Dialog com informações detalhadas:
  - Nome do cliente
  - Valor da venda
  - Lista de consequências: "A venda será marcada como dispensada", "Não aparecerá mais nas abas de faturamento ou pedidos", "Será enviada para Arquivo Morto"
  - Aviso de ação irreversível
- A ação confirma marcando `pedido_dispensado = true` e invalidando queries relevantes
- Importar `Dialog`, `CheckCircle2` e componentes necessários

### Escopo
- 1 arquivo modificado

