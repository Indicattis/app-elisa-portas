
# Fazer botao de calendário desaparecer instantaneamente apos agendamento

## Problema

O botao CalendarPlus no PedidoCard e controlado pela query `['pedido-carregamento', pedido.id]`, que consulta diretamente a tabela (`ordens_carregamento`, `instalacoes` ou `correcoes`) para verificar se existe `data_carregamento`. Apos o agendamento ser concluido, o `onSuccess` do mutation em `useOrdensCarregamentoCalendario.ts` invalida apenas as queries `ordens_carregamento_calendario`, `ordens_carregamento`, `instalacoes` e `ordens-carregamento-disponiveis` -- mas nao invalida `pedido-carregamento`. Como resultado, o PedidoCard continua mostrando o botao ate a pagina ser recarregada.

## Solucao

Adicionar `queryClient.invalidateQueries({ queryKey: ["pedido-carregamento"] })` no `onSuccess` do `updateOrdemMutation` em `useOrdensCarregamentoCalendario.ts`. Isso fara com que todos os PedidoCards re-busquem seus dados de carregamento imediatamente apos qualquer agendamento, fazendo o botao desaparecer instantaneamente.

## Mudanca

**Arquivo:** `src/hooks/useOrdensCarregamentoCalendario.ts`

Na funcao `onSuccess` do `updateOrdemMutation` (por volta da linha 347), adicionar uma linha:

```
queryClient.invalidateQueries({ queryKey: ["pedido-carregamento"] });
```

junto das invalidacoes ja existentes. Isso invalida todas as queries de carregamento de pedidos individuais, forcando o PedidoCard a re-consultar e atualizar a visibilidade do botao.
