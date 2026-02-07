

# Fix: Checkbox marca e desmarca rapidamente em /fabrica/ordens-pedidos

## Problema

O checkbox da linha usa **optimistic update** (atualiza a UI antes do servidor responder). Porem, no `onSuccess` da mutation, o codigo invalida a query `['linhas-ordem']`, que dispara um refetch imediato. Essa refetch pode retornar o valor antigo se chegar antes da escrita no banco ser totalmente confirmada, causando o flicker (marca -> desmarca -> marca).

## Solucao

Mover as invalidacoes de queries do `onSuccess` para o `onSettled` da mutation `marcarLinha`. Isso garante que:
1. O optimistic update mantem o estado correto na UI
2. Se houver erro, o `onError` reverte para o estado anterior
3. O refetch so acontece apos tudo finalizar, sem competir com o optimistic update

## Detalhe tecnico

### Arquivo: `src/components/fabrica/OrdemLinhasSheet.tsx`

Remover as invalidacoes do `onSuccess` e adiciona-las no `onSettled`:

**De (linhas 111-116):**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
  queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
  queryClient.invalidateQueries({ queryKey: ['linhas-ordem'] });
  toastHook({ title: "Atualizado" });
},
```

**Para:**
```typescript
onSuccess: () => {
  toastHook({ title: "Atualizado" });
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['ordens-por-pedido'] });
  queryClient.invalidateQueries({ queryKey: ['ordens-producao'] });
  queryClient.invalidateQueries({ queryKey: ['linhas-ordem', ordem?.id, ordem?.tipo] });
},
```

Nota: a invalidacao de `linhas-ordem` passa a usar a chave especifica (`ordem?.id, ordem?.tipo`) em vez da chave generica, evitando refetch desnecessario de outras queries.

## Arquivo modificado

1. **Editar**: `src/components/fabrica/OrdemLinhasSheet.tsx`

