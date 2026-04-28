## Goal
Replicar o botão "Carregar" presente em `/direcao/gestao-fabrica` (página `GestaoFabricaDirecao.tsx`) na página `/logistica/expedicao` (`ExpedicaoMinimalista.tsx`), permitindo concluir o carregamento de um pedido diretamente do card.

## Como funciona em GestaoFabricaDirecao
- Usa `useOrdensCarregamentoUnificadas()` para obter `ordensUnificadas` e `concluirCarregamento`.
- Define `handleCarregarOrdem(pedidoId)` que localiza a ordem com `pedido_id` correspondente e `!carregamento_concluido`, e chama `concluirCarregamento({ ordem })`.
- Passa a função para `<PedidosDraggableList onCarregarOrdem={...} />` apenas nas etapas `['aguardando_coleta','instalacoes','correcoes']`.
- O `PedidoCard` já renderiza o botão quando `onCarregarOrdem` está definido.

## Mudanças em `src/pages/logistica/ExpedicaoMinimalista.tsx`

1. Extrair `concluirCarregamento` do hook já em uso:
   ```ts
   const { ordens: ordensUnificadas, concluirCarregamento } = useOrdensCarregamentoUnificadas();
   ```

2. Adicionar handler (espelhando a lógica de Direção):
   ```ts
   const handleCarregarOrdem = async (pedidoId: string) => {
     const ordem = ordensUnificadas.find(o => o.pedido_id === pedidoId && !o.carregamento_concluido);
     if (!ordem) {
       toast.error("Nenhuma ordem agendada disponível para carregar.");
       return;
     }
     await concluirCarregamento({ ordem });
   };
   ```

3. Passar a prop ao `<PedidosDraggableList>` (linha ~932), restrita às mesmas etapas:
   ```tsx
   onCarregarOrdem={['aguardando_coleta','instalacoes','correcoes'].includes(etapa) ? handleCarregarOrdem : undefined}
   ```

## Arquivos afetados
- `src/pages/logistica/ExpedicaoMinimalista.tsx` (edit)

Nenhuma mudança em componentes compartilhados — `PedidosDraggableList` e `PedidoCard` já suportam a prop.
