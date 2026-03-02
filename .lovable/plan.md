

# Corrigir validacao de data de carregamento em usePedidosEtapas

## Problema
O hook `usePedidosEtapas.ts` (linhas 597-617) valida a ordem de carregamento antes de finalizar pedidos nas etapas `aguardando_coleta` e `instalacoes`. Porem, ele so consulta a tabela `ordens_carregamento`. Para pedidos do tipo instalacao ou correcao, os dados estao nas tabelas `instalacoes` ou `correcoes`, gerando o erro "Informe a data de carregamento antes de finalizar o pedido".

Este e o mesmo problema ja corrigido no `PedidoCard.tsx`, mas que tambem existe neste hook.

## Solucao
Alterar a validacao nas linhas 597-617 de `usePedidosEtapas.ts` para consultar as 3 tabelas sequencialmente (mesmo padrao aplicado no PedidoCard):

1. Consultar `ordens_carregamento` pelo `pedido_id`
2. Se nao encontrou, consultar `instalacoes` pelo `pedido_id`
3. Se nao encontrou, consultar `correcoes` pelo `pedido_id`
4. Usar os dados encontrados em qualquer uma das fontes para validar `data_carregamento` e `carregamento_concluido`
5. Substituir `.maybeSingle()` por `.order('created_at', { ascending: false }).limit(1)` para evitar erros com registros duplicados

### Arquivo: `src/hooks/usePedidosEtapas.ts` (linhas 597-617)

A logica sera substituida por uma busca sequencial nas 3 tabelas, usando o primeiro resultado encontrado para as validacoes de `data_carregamento` e `carregamento_concluido`.

