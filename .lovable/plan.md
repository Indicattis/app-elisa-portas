

# Corrigir exibicao de status de carregamento no PedidoCard

## Problema
No `PedidoCard.tsx`, as queries que buscam dados de carregamento para exibicao filtram com `.eq('carregamento_concluido', false)` (linhas 405, 429 e 452). Quando um pedido ja teve o carregamento concluido (`carregamento_concluido: true`), a query nao retorna resultados, fazendo o card exibir "Nao agendado" em vez de "Carregada".

Enquanto isso, o hook `usePedidosEtapas.ts` (que controla a ordenacao) nao aplica esse filtro, entao classifica corretamente esses pedidos como "Carregado" (grupo 3, ultimo). O resultado e que pedidos carregados aparecem por ultimo com o label errado "Nao agendado".

## Solucao

### Arquivo: `src/components/pedidos/PedidoCard.tsx`

Remover o filtro `.eq('carregamento_concluido', false)` das tres queries de carregamento:

**1. Correcoes (linha 405):** Remover `.eq('carregamento_concluido', false)`

**2. Instalacoes (linha 429):** Remover `.eq('carregamento_concluido', false)`

**3. Aguardando coleta (linha 452):** Remover `.eq('carregamento_concluido', false)`

Isso permite que a query retorne o registro mais recente independentemente do status de conclusao. O campo `concluido` ja e extraido do resultado e usado corretamente na logica de exibicao (linha 471: `carregamentoConcluido`), entao a remocao do filtro faz com que pedidos carregados exibam "Carregada" corretamente.

