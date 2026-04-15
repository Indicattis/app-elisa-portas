
## Plano: Reorganizar as duas primeiras etapas da Gestão de Fábrica

### Fluxo atual
1. "Pend. Faturamento" → vendas já faturadas, sem pedido criado → botão "+" cria pedido em `aprovacao_diretor`
2. "Aprovação Diretor" → pedidos na etapa `aprovacao_diretor`

### Novo fluxo desejado
1. "Pend. Faturamento" → vendas que ainda NÃO foram faturadas (sem pedido, sem faturamento completo)
2. "Aprovação Diretor" → vendas já faturadas sem pedido → diretor confirma e cria o pedido, que vai direto para `aberto` (Pedidos em Aberto)

### Alterações

**1. `src/hooks/useVendasPendentePedido.ts`**
- Renomear/criar um novo hook `useVendasPendenteFaturamento` que busca vendas NÃO faturadas (inverter o filtro `isVendaFaturada`): vendas sem `is_rascunho`, sem `pedido_dispensado`, sem `status_aprovacao === 'reprovado'`, e que `!isVendaFaturada(v)` e sem pedido vinculado
- Manter `useVendasPendentePedido` existente como está (vendas faturadas sem pedido) — será usado na tab "Aprovação Diretor"

**2. `src/hooks/usePedidoCreation.ts`**
- Alterar `etapaInicial` de `'aprovacao_diretor'` para `'aberto'` (para pedidos normais, não manutenção)
- Alterar `statusInicial` de `'pendente'` para `'aberto'`

**3. `src/pages/direcao/GestaoFabricaDirecao.tsx`**
- Tab "Pend. Faturamento" (`pendente_pedido`): trocar para usar `useVendasPendenteFaturamento` — mostra vendas sem faturamento, sem botão de criar pedido (apenas visualização/link para faturar)
- Tab "Aprovação Diretor" (`aprovacao_diretor`): além dos pedidos nesta etapa, exibir acima a lista de vendas faturadas sem pedido (dados do `useVendasPendentePedido` atual) com o botão "+" para criar pedido
- Atualizar labels e contadores

**4. Criar card simplificado para vendas pendentes de faturamento**
- Novo componente `VendaPendenteFaturamentoCard` — sem botão de criar pedido, apenas informações da venda e link para a página de faturamento

**5. `src/components/direcao/GestaoFabricaMobile.tsx`**
- Aplicar as mesmas mudanças de lógica na versão mobile

### Resumo do impacto
- Vendas não faturadas aparecem na primeira aba como pendentes
- Ao concluir faturamento, a venda aparece na aba "Aprovação Diretor"
- Diretor cria o pedido, que vai direto para "Pedidos em Aberto"
