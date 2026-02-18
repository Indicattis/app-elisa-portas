

# Corrigir layout finalizado e botao de correcao

## Problema 1: NEOs finalizados aparecem acima dos pedidos
Na etapa `finalizado`, os "Servicos Avulsos Finalizados" sao renderizados antes da `PedidosDraggableList`. O usuario quer pedidos primeiro, NEOs depois.

## Problema 2: Botao "Enviar para Correcao" nao aparece em pedidos finalizados
A query de carregamento (linha 340-346) retorna `concluido: false` para a etapa `finalizado` porque ha um early-return generico. Isso faz com que `carregamentoConcluido` seja sempre `false`, e a condicao na linha 1702 (`&& carregamentoConcluido`) impede o botao de aparecer.

## Alteracoes

### 1. `src/components/pedidos/PedidoCard.tsx` - Remover guarda de carregamento para correcao em finalizado

**Linha 1702** - O botao de correcao em `finalizado` nao deve depender de `carregamentoConcluido`, pois o pedido ja passou pela etapa de carregamento:

```
if (etapaAtual === 'finalizado' && !readOnly) {
```

### 2. `src/pages/direcao/GestaoFabricaDirecao.tsx` - Mover NEOs finalizados para depois dos pedidos

Mover o bloco de "Servicos Avulsos Finalizados" (linhas 524-573) para depois da `PedidosDraggableList` (depois da linha 596), invertendo a ordem para que pedidos aparecam primeiro.

A estrutura ficara:
1. `PedidosDraggableList` (pedidos normais)
2. Bloco de "Servicos Avulsos Finalizados" (NEOs)

O titulo "Pedidos (N)" que aparecia antes dos pedidos sera removido, ja que os pedidos serao naturalmente o primeiro conteudo.

