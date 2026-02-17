
# Simplificar botoes de acao dos pedidos em /logistica/expedicao

## Resumo

Remover os botoes de avancar, retroceder e gerar correcao dos cards de pedidos na pagina de expedicao. Manter apenas o botao de agendamento, exibido somente quando a ordem (instalacao, correcao ou carregamento) ainda nao estiver agendada.

## Alteracoes

### 1. `src/pages/logistica/ExpedicaoMinimalista.tsx`

- Remover `onMoverEtapa={handleMoverEtapa}` do componente `PedidosDraggableList` (isso elimina o botao de avancar)
- Remover `onRetrocederEtapa={handleRetrocederEtapa}` do componente `PedidosDraggableList` (isso elimina o botao de retroceder)
- Adicionar `hideCorrecaoButton={true}` ao componente `PedidosDraggableList`

### 2. `src/components/pedidos/PedidosDraggableList.tsx`

- Adicionar prop `hideCorrecaoButton?: boolean` na interface
- Repassar para cada `PedidoCard`

### 3. `src/components/pedidos/PedidoCard.tsx`

- Adicionar prop `hideCorrecaoButton?: boolean` na interface `PedidoCardProps`
- No layout lista (viewMode === 'list'), na secao de `middleButtons`:
  - Condicionar o botao "Gerar Correcao" (Wrench) a `!hideCorrecaoButton`
  - Condicionar o botao "Agendar no Calendario" (CalendarPlus) a `!temDataCarregamento` para que so apareca quando a ordem ainda nao tiver data de carregamento agendada
- No layout grid (CardFooter), aplicar a mesma logica de `hideCorrecaoButton` (caso o card seja renderizado em grid)

## Resultado esperado

- Na listagem de pedidos em `/logistica/expedicao`, cada card mostra apenas o botao de agendar (CalendarPlus) quando a ordem nao esta agendada
- Quando o usuario remove uma ordem do calendario, a ordem volta a nao ter data de carregamento, e o botao de agendar reaparece no card do pedido
- Botoes de avancar etapa, retroceder etapa e gerar correcao ficam ocultos neste contexto
