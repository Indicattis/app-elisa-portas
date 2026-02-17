
# Corrigir pedidos "Nao agendado" que nao aparecem na expedicao

## Diagnostico

O problema esta no hook `useOrdensCarregamentoUnificadas` que alimenta a lista de ordens disponiveis em `/logistica/expedicao`.

Quando um pedido avanca para a etapa `aguardando_coleta`, o sistema cria um registro na tabela `ordens_carregamento` (independente do tipo de entrega). Porem, o hook aplica dois filtros que excluem certos pedidos:

1. **Entregas**: so mostra registros de `ordens_carregamento` onde `venda.tipo_entrega === 'entrega'`. Pedidos com `tipo_entrega = 'instalacao'` sao excluidos.
2. **Instalacoes**: so mostra registros de `instalacoes` onde `pedido.etapa_atual === 'instalacoes'` ou `status === 'pronta_fabrica'`. Pedidos ainda em `aguardando_coleta` nao atendem nenhuma das condicoes.

Resultado: pedidos com `tipo_entrega = 'instalacao'` na etapa `aguardando_coleta` ficam invisiveis na expedicao, mesmo tendo um registro em `ordens_carregamento`.

## Solucao

### Arquivo: `src/hooks/useOrdensCarregamentoUnificadas.ts`

Remover o filtro restritivo de `tipo_entrega === 'entrega'` na secao de `ordens_carregamento` (linha 112-114). Em vez disso, incluir todos os registros de `ordens_carregamento` que nao estejam duplicados com registros da tabela `instalacoes`.

Logica ajustada:
- Buscar todas as `ordens_carregamento` com `carregamento_concluido = false` (sem filtrar por tipo_entrega)
- Buscar instalacoes com `carregamento_concluido = false` e `instalacao_concluida = false` (mantendo o filtro atual de etapa)
- Tambem incluir instalacoes cujo pedido esteja em `aguardando_coleta` (adicionando essa condicao ao filtro existente)
- Ao combinar, excluir registros de `ordens_carregamento` que ja tenham um registro correspondente na lista de `instalacoes` (comparando por `pedido_id`) para evitar duplicatas
- Definir o `tipo_entrega` baseado no `venda.tipo_entrega` real em vez de forcar `'entrega'`

### Detalhes tecnicos

Alteracoes no `useOrdensCarregamentoUnificadas`:

1. **Remover filtro linha 112-114**: `ordensEntrega` passa a incluir todos os registros (nao apenas `tipo_entrega === 'entrega'`)
2. **Ajustar filtro de instalacoes linha 173-174**: adicionar condicao `pedido.etapa_atual === 'aguardando_coleta'` ao filtro existente
3. **Adicionar deduplicacao**: antes de combinar, remover de `ordensCarregamento` os registros cujo `pedido_id` ja esteja presente na lista de instalacoes filtradas
4. **Corrigir tipo_entrega na normalizacao linha 207**: usar `venda.tipo_entrega` real em vez de forcar `'entrega'`

### Arquivo afetado
- `src/hooks/useOrdensCarregamentoUnificadas.ts`
