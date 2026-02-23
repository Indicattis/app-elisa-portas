
# Corrigir botao de calendário nas acoes dos pedidos

## Problema

Ao clicar no botao CalendarPlus nas acoes de um pedido (ou servico Neo), o modal `AdicionarOrdemCalendarioModal` abre mostrando a lista completa de ordens para selecao manual. O comportamento correto seria ja pre-selecionar a ordem correspondente ao pedido clicado, pulando a etapa de selecao e indo direto para a configuracao de data e responsavel.

O modal ja suporta a prop `ordemPreSelecionada` que faz exatamente isso -- o problema e que o `handleAgendarPedido` recebe o `pedidoId` mas nao o utiliza para buscar a ordem correspondente.

## Mudancas

**Arquivo:** `src/pages/logistica/ExpedicaoMinimalista.tsx`

1. Adicionar um state `ordemPreSelecionadaAgendar` do tipo `OrdemCarregamentoUnificada | null`

2. Importar o hook `useOrdensCarregamentoUnificadas` (se ainda nao importado) para ter acesso a lista de ordens unificadas

3. Alterar `handleAgendarPedido` para:
   - Receber o `pedidoId`
   - Buscar na lista de ordens unificadas a ordem cujo `pedido_id` corresponde ao pedido clicado
   - Setar `ordemPreSelecionadaAgendar` com a ordem encontrada
   - Abrir o modal normalmente

4. Alterar os handlers de `onAgendar` das Neo Instalacoes e Neo Correcoes de forma similar (buscar a ordem pelo id do servico)

5. Passar `ordemPreSelecionada={ordemPreSelecionadaAgendar}` para o `AdicionarOrdemCalendarioModal`

6. Limpar `ordemPreSelecionadaAgendar` quando o modal fecha (`onOpenChange`)

Assim, ao clicar no CalendarPlus de um pedido especifico, o modal abrira ja com a ordem pre-selecionada, exibindo apenas os campos de data e responsavel para configuracao rapida.
