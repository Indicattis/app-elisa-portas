

# Adicionar drag-and-drop para reordenar Servicos Avulsos Pendentes

## Resumo

A listagem de "Servicos Avulsos Pendentes" em `/logistica/expedicao` atualmente e uma tabela estatica sem possibilidade de reordenacao. Vamos adicionar drag-and-drop para permitir reorganizar a prioridade dos servicos, seguindo o mesmo padrao ja utilizado em `NeoDraggableList.tsx` na gestao de fabrica.

## Alteracoes necessarias

### 1. Hooks: adicionar ordenacao por prioridade e mutation de reorganizacao

**Arquivo: `src/hooks/useNeoInstalacoesSemData`** (dentro de `useNeoInstalacoes.ts`)
- Alterar `.order("created_at", { ascending: false })` para `.order("prioridade_gestao", { ascending: false })` seguido de `.order("created_at", { ascending: false })` como fallback
- Adicionar uma `reorganizarMutation` que atualiza `prioridade_gestao` para cada item (identica a que ja existe no hook principal `useNeoInstalacoes`)
- Exportar `reorganizarNeoInstalacoes` no retorno do hook

**Arquivo: `src/hooks/useNeoCorrecoesSemData`** (dentro de `useNeoCorrecoes.ts`)
- Mesma alteracao: ordenar por `prioridade_gestao` desc, depois `created_at` desc
- Adicionar `reorganizarMutation` identica
- Exportar `reorganizarNeoCorrecoes`

### 2. Componente: adicionar DnD na tabela

**Arquivo: `src/components/expedicao/NeoServicosDisponiveis.tsx`**
- Envolver a tabela com `DndContext` + `SortableContext` do `@dnd-kit`
- Criar um componente `SortableTableRow` que usa `useSortable` para tornar cada linha arrastavel
- Adicionar uma coluna de "grip handle" (icone de arrastar) como primeira coluna da tabela
- Adicionar `DragOverlay` com portal para mostrar a linha sendo arrastada
- Na funcao `handleDragEnd`, calcular a nova ordem e chamar `onReorganizar`
- Adicionar props `onReorganizarInstalacoes` e `onReorganizarCorrecoes` na interface

### 3. Pagina: passar as funcoes de reorganizacao

**Arquivo: `src/pages/logistica/ExpedicaoMinimalista.tsx`**
- Importar `reorganizarNeoInstalacoes` e `reorganizarNeoCorrecoes` dos hooks sem data
- Passar como props para `NeoServicosDisponiveis`

**Arquivo: `src/pages/direcao/CalendarioExpedicaoDirecao.tsx`**
- Mesma alteracao para a pagina da direcao

### 4. Mobile: manter sem drag (conforme padrao do sistema)

O componente `NeoServicosDisponiveisMobile` NAO recebera drag-and-drop, seguindo o padrao existente onde DnD e desabilitado em mobile.

## Detalhes tecnicos

- Usar `PointerSensor` com `activationConstraint: { distance: 8 }` para evitar conflito com cliques
- A lista combinada (instalacoes + correcoes) sera ordenada por `prioridade_gestao` decrescente
- Ao reorganizar, os IDs de instalacao e correcao serao separados e cada mutation chamada independentemente
- O `DragOverlay` renderiza uma copia da linha com `createPortal` para o `document.body`

