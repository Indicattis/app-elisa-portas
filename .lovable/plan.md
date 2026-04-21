

## Corrigir fluxo: Faturamento NÃO deve criar pedido automaticamente

### Diagnóstico

A regra do fluxo é:
1. **Pend. Faturamento** → vendas ainda não faturadas
2. Vendedor/Financeiro fatura a venda → ela some de "Pend. Faturamento" e aparece em **Aprovação Diretor** (ainda como **venda**, não como pedido)
3. **Diretor** clica para criar o pedido manualmente, e ele nasce na etapa `aprovacao_diretor`

**Problema encontrado:** em `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` (linhas 636-651), logo após `finalizarFaturamento` o código chama `createPedidoFromVenda(venda.id)` automaticamente. Resultado: a venda já vira pedido e cai como "pedido pronto" em Aprovação Diretor, pulando a etapa de validação manual do Diretor.

Os 3 pedidos atualmente em `aprovacao_diretor` no banco (#0381, #0382, #0384) foram criados por esse caminho.

A página antiga `src/pages/FaturamentoEdit.tsx` **não** tem essa criação automática (já está correta), e o botão "+" em `Faturamento.tsx` é manual (correto).

### Correção

**Arquivo:** `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Remover o bloco de auto-criação de pedido após o faturamento (linhas ~636-651). Manter apenas:
- `finalizarFaturamento(...)` (atualiza venda + produtos + frete_aprovado)
- `fetchVenda()` para recarregar
- Toast simplificado: "Venda faturada com sucesso! Aguardando criação de pedido pela Direção."

A venda passará então a aparecer automaticamente na aba "Aprovação Diretor" da Gestão de Fábrica como item da lista `vendasPendentePedido` (já implementado), e o pedido só será criado quando o Diretor clicar no botão "+" do card.

### Fora de escopo

- Não mexer em `Faturamento.tsx` (botão manual já está correto)
- Não alterar `usePedidoCreation` nem a etapa inicial dos pedidos
- Não excluir os 3 pedidos já criados em `aprovacao_diretor` (#0381, #0382, #0384) — eles seguem o fluxo normal a partir daí. Se desejar, posso movê-los/arquivá-los em uma ação separada, mas não é necessário para corrigir o fluxo daqui pra frente.

### Atualização de memória

Atualizar `mem://features/direcao/aprovacao-diretor-workflow-v2-full-auto-creation` removendo qualquer indicação de auto-criação de pedido no faturamento, deixando explícito: "Faturamento NUNCA cria pedido automaticamente. O Diretor cria manualmente a partir da aba Aprovação Diretor."

