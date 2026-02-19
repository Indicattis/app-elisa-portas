
# Corrigir botao de agendar pedido na Gestao da Fabrica

## Problema

O botao de agendar (CalendarPlus) no PedidoCard abre o modal `AdicionarOrdemCalendarioModal`, que e um modal generico de busca e selecao de ordens no calendario. O correto seria abrir o `AgendarCarregamentoModal`, que permite definir data, hora e responsavel diretamente para a ordem de carregamento do pedido.

Alem disso, o `pedidoId` nem sequer e armazenado quando o botao e clicado -- ele e recebido no callback mas nunca salvo em estado.

## Solucao

### Alteracao em `src/pages/direcao/GestaoFabricaDirecao.tsx`

1. **Adicionar estado** para armazenar a ordem de carregamento selecionada:
   - `agendarOrdem: OrdemCarregamento | null`

2. **Alterar `handleAgendarPedido`** para buscar a ordem de carregamento do pedido no banco (`ordens_carregamento` onde `pedido_id = pedidoId`) e abrir o modal correto com essa ordem.

3. **Substituir** o componente `AdicionarOrdemCalendarioModal` pelo `AgendarCarregamentoModal`, passando a ordem encontrada e um callback `onConfirm` que atualiza a ordem no banco via `supabase.from('ordens_carregamento').update(...)`.

4. **Importar** `AgendarCarregamentoModal` e os tipos necessarios (`OrdemCarregamento`, `AgendarCarregamentoData`).

### Fluxo corrigido

1. Usuario clica no botao CalendarPlus no PedidoCard
2. Sistema busca a ordem de carregamento do pedido no banco
3. Abre o `AgendarCarregamentoModal` com os dados da ordem
4. Usuario preenche data, hora e responsavel
5. Sistema atualiza a ordem de carregamento no banco
6. Queries sao invalidadas para refletir a mudanca

### Observacao

O modal `AdicionarOrdemCalendarioModal` continuara sendo usado em outros contextos (calendario de expedicao, etc) -- apenas na pagina de Gestao da Fabrica sera substituido pelo modal correto.
