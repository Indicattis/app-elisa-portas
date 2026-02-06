
# Temporizador Total e Remocao do Botao Excluir

## Alteracoes

### 1. PedidoCard.tsx - Adicionar temporizador total desde a criacao

Ao lado do `CronometroEtapaBadge` (tempo na etapa), adicionar um segundo badge mostrando o tempo total desde `pedido.created_at`. Este temporizador nunca para - conta tempo corrido real (nao apenas expediente), usando `formatDistanceToNow` do date-fns ou um cronometro simples.

**Na view de lista (Col 13, linha ~1407-1410)**: Adicionar ao lado do CronometroEtapaBadge existente um novo badge com icone de relogio mostrando o tempo total desde `created_at`.

**Na view de grid (linha ~1641-1642)**: Mesmo tratamento, ao lado do CronometroEtapaBadge.

O temporizador total usara `formatDistanceToNow` com `addSuffix: false` e locale ptBR para exibir valores como "3 dias", "2 semanas", etc. Sera um badge cinza/neutro para diferenciar do badge colorido da etapa.

### 2. PedidoCard.tsx - Remover botao de excluir pedido

Remover os botoes de excluir pedido em ambas as views (list e grid):
- **List view (linhas 1432-1446)**: Remover o bloco que adiciona o botao Trash2 ao `middleButtons`
- **Grid view (linhas 1868-1884)**: Remover o bloco que adiciona o botao Trash2 ao `actionButtons`

### 3. GestaoFabricaDirecao.tsx - Remover prop onDeletar

Remover a passagem de `onDeletar={handleDeletarPedido}` para o `PedidosDraggableList`, ja que o botao de excluir nao existira mais nesta pagina.

## Arquivos afetados

1. `src/components/pedidos/PedidoCard.tsx` - temporizador total + remocao do excluir
2. `src/pages/direcao/GestaoFabricaDirecao.tsx` - remover prop onDeletar
