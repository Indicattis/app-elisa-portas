

# Drag-and-Drop para Neos na Gestao de Fabrica

## Resumo
Adicionar ordenacao com drag-and-drop nos cards de Neo Instalacoes e Neo Correcoes dentro da pagina `/direcao/gestao-fabrica`, nas etapas "instalacoes", "correcoes" e "finalizado". O sistema seguira o mesmo padrao ja usado nos pedidos (campo de prioridade + `@dnd-kit/sortable`).

## Alteracoes

### 1. Migracao SQL - Adicionar coluna `prioridade_gestao`

Adicionar coluna `prioridade_gestao` (integer, default 0) nas tabelas `neo_instalacoes` e `neo_correcoes` para persistir a ordem definida pelo usuario.

### 2. `src/hooks/useNeoInstalacoes.ts` e `src/hooks/useNeoCorrecoes.ts`

- Ordenar a query de listagem por `prioridade_gestao DESC` (prioridade maior = aparece primeiro), mantendo `data_instalacao/data_correcao` como criterio secundario
- Adicionar mutation `reorganizarNeos` que recebe array `{ id, prioridade_gestao }[]` e faz batch update via supabase

### 3. `src/components/pedidos/NeoInstalacaoCardGestao.tsx` e `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

- Aceitar prop opcional `dragHandleProps` para renderizar o handle de arrastar (icone GripVertical) na primeira coluna (Col 1, que hoje esta vazia)
- Quando `dragHandleProps` for passado, exibir o cursor grab e os listeners de drag

### 4. `src/pages/direcao/GestaoFabricaDirecao.tsx`

Na renderizacao das listas de Neos (linhas 524-556), substituir o `.map` simples por um bloco com `DndContext` + `SortableContext` do `@dnd-kit/sortable`:

- Envolver cada lista de neos num `DndContext` separado (para nao conflitar com o DnD dos pedidos)
- Usar `SortableContext` com `verticalListSortingStrategy`
- Criar componente inline `SortableNeoItem` que usa `useSortable` e repassa `dragHandleProps` para o card
- No `onDragEnd`, recalcular prioridades e chamar a mutation `reorganizarNeos`

### 5. `src/components/direcao/GestaoFabricaMobile.tsx`

Nao adicionar drag-and-drop no mobile (seguindo o padrao existente onde DnD e desabilitado no mobile).

### Arquivos envolvidos
- **Novo:** Migracao SQL (adicionar `prioridade_gestao` em `neo_instalacoes` e `neo_correcoes`)
- **Editar:** `src/hooks/useNeoInstalacoes.ts` (ordenacao + mutation reorganizar)
- **Editar:** `src/hooks/useNeoCorrecoes.ts` (ordenacao + mutation reorganizar)
- **Editar:** `src/components/pedidos/NeoInstalacaoCardGestao.tsx` (drag handle)
- **Editar:** `src/components/pedidos/NeoCorrecaoCardGestao.tsx` (drag handle)
- **Editar:** `src/pages/direcao/GestaoFabricaDirecao.tsx` (DndContext + SortableContext nas listas de neos)

