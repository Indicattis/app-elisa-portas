

# Corrigir posicao do card durante drag-and-drop

## Problema

Ao arrastar um card no calendario de expedicao, o overlay (copia visual do card) aparece muito distante do cursor. Isso ocorre porque os componentes draggable aplicam `CSS.Translate.toString(transform)` no elemento original, movendo-o junto com o cursor, enquanto o `DragOverlay` renderiza uma segunda copia separada. Essa duplicidade causa o deslocamento visual.

## Solucao

Remover a transformacao CSS dos componentes draggable e deixar apenas o `DragOverlay` ser responsavel pela representacao visual durante o arrasto. Os componentes originais devem apenas ficar com opacidade reduzida (ou ocultos) durante o drag.

## Detalhes tecnicos

### Arquivos a editar

**1. `src/components/expedicao/DraggableOrdemCarregamento.tsx`**
- Remover `transform: CSS.Translate.toString(transform)` do style
- Manter apenas `opacity: isDragging ? 0.3 : 1` para indicar visualmente que o item esta sendo arrastado
- Remover import de `CSS` do `@dnd-kit/utilities`

**2. `src/components/expedicao/DraggableNeoInstalacao.tsx`**
- Mesma alteracao: remover transform, manter apenas opacity
- Remover import de `CSS`

**3. `src/components/expedicao/DraggableNeoCorrecao.tsx`**
- Mesma alteracao: remover transform, manter apenas opacity
- Remover import de `CSS`

### Exemplo da mudanca (aplicado nos 3 arquivos)

De:
```typescript
import { CSS } from "@dnd-kit/utilities";

const style = {
  transform: CSS.Translate.toString(transform),
  opacity: isDragging ? 0.5 : 1,
  cursor: disableDrag ? "pointer" : isDragging ? "grabbing" : "grab",
};
```

Para:
```typescript
const style = {
  opacity: isDragging ? 0.3 : 1,
  cursor: disableDrag ? "pointer" : "grab",
};
```

Isso faz com que apenas o `DragOverlay` (ja configurado nos calendarios semanal e mensal) acompanhe o cursor, eliminando o problema de posicionamento.

