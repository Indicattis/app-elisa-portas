

# Adicionar Ordem de Embalagem em /fabrica/ordens-pedidos

## Resumo
Incluir a ordem de embalagem junto das demais ordens (soldagem, perfiladeira, separacao, qualidade, pintura) na pagina de Ordens por Pedido.

## Alteracoes

### 1. Hook `src/hooks/useOrdensPorPedido.ts`

- Adicionar `'embalagem'` ao type `TipoOrdem` (linha 5)
- Adicionar `embalagem: OrdemStatus` ao interface `PedidoComOrdens.ordens` (linha 76, entre pintura e carregamento)
- Na funcao `useOrdensPorPedido`, adicionar query para `ordens_embalagem` no `Promise.all` (entre pinturaRes e carregamentoRes):
  ```
  supabase.from('ordens_embalagem')
    .select('id, pedido_id, numero_ordem, status, responsavel_id, capturada_em, tempo_conclusao_segundos')
    .in('pedido_id', pedidoIds)
  ```
- Adicionar `embalagemRes` ao array de coleta de `allResponsavelIds`
- Chamar `processOrdens(embalagemRes.data, 'embalagem')` no mapeamento de ordens
- Adicionar `embalagem: criarOrdemStatus('embalagem')` ao objeto `ordens` retornado

### 2. Componente `src/components/fabrica/PedidoOrdemCard.tsx`

- Adicionar `embalagem: 'Embalagem'` ao `ORDEM_LABELS` (linha 23, entre pintura e carregamento)
- Adicionar `pedido.ordens.embalagem` ao array `ordensBase` (linha 68, entre pintura e o fechamento do array)

### 3. Pagina `src/pages/fabrica/OrdensPorPedido.tsx`

- Adicionar `pedido.ordens.embalagem` ao array de ordens no calculo de metricas (linha 43, entre qualidade e pintura)

