

## Plano: Aba "Pendente Faturamento" na Gestão de Fábrica

### Resumo
Adicionar uma nova aba antes de "Aprovação Diretor" que lista vendas faturadas que ainda não possuem pedido de produção vinculado. Agrupar esta aba junto com "Aprovação Diretor" em uma borda azul, separada do grupo vermelho de produção.

### Mudanças

**1. Novo hook `src/hooks/useVendasPendentePedido.ts`**
- Buscar vendas onde `frete_aprovado = true`, todos os `produtos_vendas` com `faturamento = true`, e que NÃO possuem registro em `pedidos_producao` (via left join ou filtro client-side)
- Também excluir vendas com `status_aprovacao = 'reprovado'` e `is_rascunho = true`
- Retornar lista com dados do cliente, produtos, valores e contagem

**2. Atualizar `src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Adicionar estado para a nova aba virtual `'pendente_pedido'` (não é uma etapa de pedido)
- Alterar o tipo de `etapaAtiva` para incluir `'pendente_pedido'`
- No desktop, criar novo grupo azul (`border-2 border-blue-500/50`) ANTES do grupo vermelho, contendo:
  - Aba "Pend. Faturamento" (ícone DollarSign ou similar)
  - Aba "Aprovação Diretor" (movida do grupo vermelho)
- Ajustar o grupo vermelho para começar em "Aberto"
- Adicionar `TabsContent` para `pendente_pedido` com card listando as vendas pendentes (nome do cliente, produtos, valor total, data da venda)
- No seletor mobile, incluir a nova opção no início

**3. Conteúdo da aba**
- Card com lista de vendas faturadas sem pedido
- Cada item mostra: cliente, data, valor total, quantidade de portas
- Informação visual simples (sem ações de criação de pedido nesta aba — apenas visualização)

### Arquivos alterados
- Novo: `src/hooks/useVendasPendentePedido.ts`
- `src/pages/direcao/GestaoFabricaDirecao.tsx`

