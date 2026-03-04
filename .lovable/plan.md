

# Correções: Abrir downbar em vez de sidebar ao clicar no pedido

## Problema

Quando um pedido na etapa `correcoes` é clicado, o código intercepta o clique e abre o `CorrecaoDetalhesSheet` (sidebar lateral direita) em vez do `PedidoDetalhesSheet` (downbar que sobe de baixo), que é o comportamento padrão de todas as outras etapas.

Isso acontece porque em `PedidoCard.tsx` (linha 1116), quando `onCorrecaoDetalhesClick` está definido e a etapa é `correcoes`, o clique abre a sidebar em vez da downbar.

## Correção

### `src/pages/direcao/GestaoFabricaDirecao.tsx`
- Remover a prop `onCorrecaoDetalhesClick` passada ao `PedidosDraggableList` (linhas 648-651)
- Remover os states `correcaoDetalhesPedidoId` e `correcaoDetalhesOpen` (linha 82-83)
- Remover o bloco que renderiza `CorrecaoDetalhesSheet` (linhas 987-1003)
- Remover o import de `CorrecaoDetalhesSheet` (linha 15)

Com essa remoção, o clique no card seguirá o fluxo padrão: `setShowDetalhes(true)` → abre `PedidoDetalhesSheet` (downbar de baixo).

