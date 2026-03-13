

## Plano: Mostrar observações da visita nos cards de embalagem

### Problema
Os cards de embalagem em `/producao/embalagem` não mostram as observações da visita técnica (dados de `pedido_porta_observacoes`). O hook `useOrdemEmbalagem` não busca esses dados, ao contrário do `useOrdemPintura` que já faz isso.

### Mudanças

**1. `src/hooks/useOrdemEmbalagem.ts`**
- Adicionar query para buscar `pedido_porta_observacoes` por `pedido_id` (mesmo padrão do `useOrdemPintura`, linhas 153-157)
- Incluir `observacoesVisita` no objeto retornado de cada ordem

**2. `src/components/production/ProducaoPinturaKanban.tsx`**
- Adicionar `observacoesVisita` na interface `Ordem`
- Exibir as observações da visita nos cards, com as opções estruturadas (tubo, interna/externa, posição guia, etc.) usando os labels de `pedidoObservacoes.ts`
- Mostrar abaixo das observações existentes, com ícone e estilo amber (mesmo padrão visual já usado)

