

## Plano: Criar pedido automaticamente ao faturar venda

### Problema atual
Quando uma venda é faturada em `/administrativo/financeiro/faturamento/vendas`, o sistema pergunta se o usuário quer criar o pedido. Se clicar "Não, criar depois", a venda fica presa na aba "Pend. Faturamento" de `/direcao/gestao-fabrica`. O fluxo esperado é que o faturamento já crie o pedido automaticamente e ele vá direto para "Aprovação Diretor".

### Solução
Remover a pergunta e criar o pedido de produção automaticamente ao concluir o faturamento. A venda faturada nunca ficará em "Pend. Faturamento" -- ela já terá um pedido na etapa "Aprovação Diretor".

### Alterações

**1. `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`**
- Na função `executarFaturamento`, após faturar com sucesso, chamar `createPedidoFromVenda` automaticamente (sem diálogo de confirmação)
- Remover o modal "Deseja criar o pedido de produção?" (o `AlertDialog` de criação de pedido)
- Manter apenas o feedback de sucesso informando que a venda foi faturada e o pedido criado

**2. `src/pages/Faturamento.tsx`** (se houver fluxo similar)
- Aplicar a mesma lógica: criar pedido automaticamente após faturamento bem-sucedido

### Resultado
- Faturar uma venda cria o pedido automaticamente na etapa "Aprovação Diretor"
- A aba "Pend. Faturamento" só mostrará vendas faturadas que por algum motivo técnico não tiveram pedido criado (casos legados)
- Fluxo mais limpo: faturou → pedido criado → diretor aprova

