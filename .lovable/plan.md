

# Reprovar pedido na etapa Aprovacao CEO

## Resumo

Adicionar funcionalidade de reprovacao na tela de Aprovacoes Fabrica. Pedidos reprovados voltam para "aberto" com estilizacao vermelha. Ao avancar novamente, a estilizacao vermelha some.

## Alteracoes

### 1. Banco de dados: nova coluna `reprovado_ceo`

Adicionar coluna `reprovado_ceo` (boolean, default false) na tabela `pedidos_producao`. Essa flag indica que o pedido foi reprovado e deve ser exibido com destaque vermelho.

### 2. `src/hooks/usePedidosAprovacaoCEO.ts`

Adicionar mutation `reprovarPedido` que:
- Fecha a etapa atual (`aprovacao_ceo`) em `pedidos_etapas` com `data_saida = now()`
- Cria nova entrada em `pedidos_etapas` para etapa `aberto`
- Atualiza `pedidos_producao` com `etapa_atual = 'aberto'` e `reprovado_ceo = true`
- Registra movimentacao em `pedidos_movimentacoes` com teor de reprovacao
- Invalida queries relevantes

### 3. `src/pages/direcao/aprovacoes/AprovacoesProducao.tsx`

Adicionar botao "Reprovar" vermelho ao lado do botao "Aprovar" na area expandida do card. Incluir confirmacao antes de reprovar (AlertDialog).

### 4. `src/hooks/usePedidosEtapas.ts`

Na mutation `moverParaProximaEtapa`, quando a etapa atual for `aberto`, resetar `reprovado_ceo = false` no update do pedido para que a estilizacao vermelha desapareca ao avancar.

### 5. `src/components/pedidos/PedidoCard.tsx`

Adicionar condicional de estilizacao: quando `reprovado_ceo = true`, aplicar borda vermelha e badge "Reprovado CEO" similar ao estilo de backlog (borda vermelha, sombra vermelha).

