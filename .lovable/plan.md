

# Adicionar drag-and-drop para ordenar cidades dentro de um estado

## Resumo

Adicionar funcionalidade de arrastar e soltar (drag-and-drop) para reordenar as cidades na pagina de detalhe do estado em `/direcao/autorizados/estado/:id`. Seguindo o mesmo padrao ja usado para reordenar estados.

## Alteracoes necessarias

### 1. Banco de dados: adicionar coluna `ordem` na tabela `cidades_autorizados`

A tabela `cidades_autorizados` nao possui coluna `ordem`. Sera necessario adicionar via migration SQL:

```sql
ALTER TABLE cidades_autorizados ADD COLUMN ordem integer DEFAULT 0;
```

### 2. `src/hooks/useEstadosCidades.ts`

- Na funcao `fetchCidadesDoEstado`, alterar o `.order('nome')` para `.order('ordem').order('nome')` na query de `cidades_autorizados`
- Adicionar funcao `reordenarCidades` seguindo o padrao de `reordenarEstados`:
  - Recebe array de `Cidade[]` na nova ordem
  - Faz update do campo `ordem` para cada cidade via `supabase.update({ ordem: index })`
  - Atualiza o estado local `setCidades` otimisticamente
  - Em caso de erro, refaz o fetch

### 3. `src/components/autorizados/EstadoDetalheView.tsx`

- Importar `DndContext`, `closestCenter`, `KeyboardSensor`, `PointerSensor`, `useSensor`, `useSensors` de `@dnd-kit/core`
- Importar `SortableContext`, `verticalListSortingStrategy` de `@dnd-kit/sortable`
- Importar `restrictToVerticalAxis` de `@dnd-kit/modifiers`
- Adicionar prop `onReordenarCidades: (cidades: Cidade[]) => void`
- Envolver a lista de `CidadeCollapsible` com `DndContext` + `SortableContext`
- Implementar handler `handleDragEnd` que calcula a nova ordem e chama `onReordenarCidades`

### 4. `src/components/autorizados/CidadeCollapsible.tsx`

- Criar novo componente `SortableCidadeCollapsible` que envolve `CidadeCollapsible` com `useSortable`
- Adicionar icone `GripVertical` como handle de arrasto (ao lado do icone Building2)
- Aplicar `transform` e `transition` do sortable no wrapper

### 5. `src/pages/direcao/EstadoAutorizadosDirecao.tsx`

- Extrair `reordenarCidades` do hook `useEstadosCidades`
- Passar `onReordenarCidades={reordenarCidades}` para `EstadoDetalheView`

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| cidades_autorizados (SQL) | Adicionar coluna `ordem` |
| useEstadosCidades.ts | Adicionar `reordenarCidades`, ordenar por `ordem` |
| EstadoDetalheView.tsx | Adicionar DnD context e prop `onReordenarCidades` |
| CidadeCollapsible.tsx | Criar `SortableCidadeCollapsible` com handle de arrasto |
| EstadoAutorizadosDirecao.tsx | Passar `reordenarCidades` para a view |

