

# Fix: Checkbox flicker persistente em /fabrica/ordens-pedidos

## Problema real

Mover invalidacoes para `onSettled` nao resolve porque o `invalidateQueries` na key `['linhas-ordem', ordem?.id, ordem?.tipo]` ainda dispara um refetch. Se o banco retornar dados "stale" (cache do Supabase, replicacao, etc.), o optimistic update e sobrescrito.

O optimistic update ja garante o estado correto na UI. Nao ha necessidade de refazer o fetch da mesma query logo apos a mutation individual de checkbox.

## Solucao

Remover a invalidacao de `linhas-ordem` do `onSettled` da mutation `marcarLinha`. Manter apenas as invalidacoes de `ordens-por-pedido` e `ordens-producao` (que sao queries diferentes e precisam atualizar contadores).

## Detalhe tecnico

### Arquivo: `src/components/fabrica/OrdemLinhasSheet.tsx`

**Linha 114-118 - Remover invalidacao de linhas-ordem do onSettled:**

De:
```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
  queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
  queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
},
```

Para:
```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
  queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
},
```

O optimistic update no `onMutate` ja atualiza o cache local corretamente. Se houver erro, o `onError` reverte. Nao ha necessidade de refetch.

## Arquivo modificado

1. **Editar**: `src/components/fabrica/OrdemLinhasSheet.tsx`

