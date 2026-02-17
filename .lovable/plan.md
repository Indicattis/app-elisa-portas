

# Corrigir erro "useDndMonitor must be used within DndContext"

## Problema
O componente `VerMaisCardsPopover` usa o hook `useDndMonitor` que exige estar dentro de um `<DndContext>`. Quando o `CalendarioExpedicaoModal` renderiza o calendario em modo `readOnly`, o calendario mensal nao envolve o conteudo com `DndContext`, causando o crash.

## Causa raiz
O `VerMaisCardsPopover` sempre chama `useDndMonitor` (hooks nao podem ser condicionais em React), mas o `CalendarioMensalExpedicaoDesktop` em modo `readOnly` nao renderiza um `DndContext` ao redor do conteudo.

## Solucao
Envolver o conteudo do `CalendarioExpedicaoModal` com um `<DndContext>` simples (sem sensores nem handlers), garantindo que os hooks de DnD dos componentes filhos tenham o contexto necessario, mesmo sem funcionalidade de drag-and-drop.

## Alteracao

### `src/components/pedidos/CalendarioExpedicaoModal.tsx`
- Importar `DndContext` de `@dnd-kit/core`
- Envolver o conteudo do calendario (tanto mensal quanto semanal) com `<DndContext>` sem nenhum handler

Essa abordagem e minima e nao afeta nenhum outro componente. O `DndContext` vazio simplesmente fornece o contexto que os hooks precisam, sem habilitar nenhuma funcionalidade de drag.

