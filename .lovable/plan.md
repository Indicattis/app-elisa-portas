
# Corrigir neo finalizada que nao desaparece ao concluir

## Problema
Na etapa "finalizado" de `/direcao/gestao-fabrica`, ao clicar no botao de concluir em uma Neo ja finalizada, ela nao desaparece. Isso acontece porque:

1. A Neo ja tem `concluida = true` no banco, entao o UPDATE nao altera nada
2. A mutation `concluirMutation` nao invalida as queries `neo_instalacoes_finalizadas` / `neo_correcoes_finalizadas`
3. Como nao ha mudanca real no banco, o realtime tambem nao dispara

## Solucao
Adicionar a invalidacao das queries de finalizadas no `onSuccess` das mutations de conclusao, em ambos os hooks.

## Alteracoes

### 1. `src/hooks/useNeoInstalacoes.ts`
No `onSuccess` da `concluirMutation` dentro de `useNeoInstalacoesListagem`, adicionar:
```
queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_finalizadas"] });
```

Alem disso, para que o item realmente "desapareca" da lista de finalizados, o botao de concluir precisa fazer algo diferente quando o item ja esta concluido. A abordagem mais simples: atualizar o campo `concluida_em` para null (ou uma data muito antiga) para que saia do filtro de 30 dias. Alternativa: adicionar um campo `arquivada` ou mudar o status para algo como `arquivada`.

**Abordagem escolhida**: Mudar o status para `'arquivada'` quando a neo ja esta concluida. A query de finalizadas filtra por `concluida = true`, entao precisamos tambem setar `concluida = false` ou filtrar por status diferente de `arquivada`. A forma mais limpa: setar um campo que faca o item sair da query. Como a query filtra `concluida = true`, basta setar `concluida = false` na segunda chamada (remocao manual).

**Abordagem final mais simples**: Na pagina GestaoFabricaDirecao, o handler de concluir para neos finalizadas deve usar uma logica diferente - remover o item otimisticamente do cache local e invalidar a query. Podemos fazer isso adicionando `onMutate` com update otimista, ou simplesmente garantindo que a invalidacao ocorra.

Na verdade, o problema mais fundamental e que o UPDATE nao muda nada (ja esta `concluida = true`), entao o Supabase nao emite evento realtime. A solucao correta e:
- Adicionar `updated_at: new Date().toISOString()` ao update da correcao (ja existe na instalacao)
- Adicionar invalidacao de `_finalizadas` no `onSuccess` de ambas as mutations

### 2. `src/hooks/useNeoCorrecoes.ts`
Mesma correcao: adicionar `updated_at` ao update e invalidar `neo_correcoes_finalizadas` no `onSuccess`.

## Detalhes tecnicos

### `src/hooks/useNeoInstalacoes.ts` - `concluirMutation.onSuccess` (linha ~271)
Adicionar:
```typescript
queryClient.invalidateQueries({ queryKey: ["neo_instalacoes_finalizadas"] });
```

### `src/hooks/useNeoCorrecoes.ts` - `concluirNeoCorrecao.onSuccess` (linha ~271)
Adicionar:
```typescript
queryClient.invalidateQueries({ queryKey: ["neo_correcoes_finalizadas"] });
```

### `src/hooks/useNeoCorrecoes.ts` - `concluirNeoCorrecao.mutationFn` (linha ~259)
Adicionar `updated_at: new Date().toISOString()` ao objeto de update para garantir que o realtime detecte a mudanca.

## Arquivos envolvidos
- `src/hooks/useNeoInstalacoes.ts` (adicionar invalidacao de finalizadas)
- `src/hooks/useNeoCorrecoes.ts` (adicionar invalidacao de finalizadas + updated_at)
