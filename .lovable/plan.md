

## Bug: Lista não atualiza após excluir função

### Causa raiz

A query de busca usa `queryKey: ['system-roles-active']` (linha 62), mas após a exclusão o código invalida `queryKey: ['system-roles']` (linha 120). Como as keys não batem, o React Query não refaz a busca e a lista permanece inalterada na tela — mesmo que o banco tenha sido atualizado corretamente.

### Correção

Em `src/pages/direcao/GestaoColaboradoresDirecao.tsx`, linha 120, trocar:

```ts
// De:
queryClient.invalidateQueries({ queryKey: ['system-roles'] });

// Para:
queryClient.invalidateQueries({ queryKey: ['system-roles-active'] });
```

Uma única linha alterada em um único arquivo.

