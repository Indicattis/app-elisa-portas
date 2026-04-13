

## Plano: Card de venda estilo PedidoCard na aba Pendente Faturamento

### Resumo
Substituir os divs simples da aba "Pendente Faturamento" por cards com o mesmo design visual dos pedidos (Card com h-10, grid layout compacto, avatar do atendente, badges, etc.).

### Mudanças

**1. Novo componente `src/components/pedidos/VendaPendentePedidoCard.tsx`**
- Card compacto h-10 idêntico ao layout list do PedidoCard
- Grid com colunas: avatar atendente | nome cliente | data venda | qtd portas (badge) | valor total | seta/indicador
- Mesma estilização: `hover:shadow-sm transition-all cursor-pointer h-10 overflow-hidden`
- Click navega para `/administrativo/financeiro/faturamento/{id}?from=vendas`
- Usar TooltipProvider para tooltips no nome do cliente e atendente

**2. Atualizar `src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Na TabsContent de `pendente_pedido`, substituir os divs atuais (linhas 703-731) pelo novo `VendaPendentePedidoCard`
- Envolver a lista em `<TooltipProvider>` como o PedidosDraggableList faz

### Arquivo novo
- `src/components/pedidos/VendaPendentePedidoCard.tsx`

### Arquivo alterado
- `src/pages/direcao/GestaoFabricaDirecao.tsx`

