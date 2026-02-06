
# Exibir Aviso de Espera em /direcao/gestao-fabrica

## Problema

O componente `PedidoCard` ja suporta o aviso de espera (botao, modal, destaque visual), mas o `PedidosDraggableList` nao aceita nem repassa a prop `onAvisoEspera`. Como a pagina de gestao de fabrica usa `PedidosDraggableList`, o aviso nao aparece.

## Alteracoes

### 1. PedidosDraggableList.tsx - Adicionar prop `onAvisoEspera`

- Adicionar `onAvisoEspera` nas interfaces `PedidosDraggableListProps` e `SortableItemProps`
- Repassar para `PedidoCard` nos 3 pontos de renderizacao: `SortableItem`, lista sem drag, e `DragOverlay`

### 2. GestaoFabricaDirecao.tsx - Criar handler e passar prop

- Criar funcao `handleAvisoEspera` que atualiza `aviso_espera`, `aviso_espera_data` e `prioridade_etapa` no banco (mesma logica de `PedidosAdminMinimalista.tsx`)
- Passar `onAvisoEspera={handleAvisoEspera}` para `PedidosDraggableList`

## Arquivos afetados

1. `src/components/pedidos/PedidosDraggableList.tsx` - nova prop
2. `src/pages/direcao/GestaoFabricaDirecao.tsx` - handler + prop
