

# Corrigir contador da aba "Finalizado" em /direcao/gestao-fabrica

## Problema

O contador da aba "Finalizado" mostra **1**, mas nenhum item aparece na lista. Isso acontece porque:

- **Contador** (`usePedidosContadores`): conta **todas** as `neo_instalacoes` com `concluida = true` — sem filtro de data.
- **Lista** (`useNeoInstalacoesFinalizadas`): filtra apenas os **últimos 30 dias** (`gte("concluida_em", dataLimite)`).

Existe 1 neo_instalação concluída em 28/01/2026, que está fora dos últimos 30 dias (hoje é 03/03/2026). Ela aparece no contador mas não na lista.

## Solução

Aplicar o mesmo filtro de 30 dias no contador dentro de `usePedidosContadores` (em `src/hooks/usePedidosEtapas.ts`), para que o contador reflita exatamente o que a lista exibe.

### Alteração em `src/hooks/usePedidosEtapas.ts`

Na query de neo_instalações finalizadas (linhas 86-93), adicionar filtro `.gte('concluida_em', dataLimite)`:

```typescript
const dataLimite = new Date();
dataLimite.setDate(dataLimite.getDate() - 30);

const { count: neoInstalacaoFinalizadaCount } = await supabase
  .from('neo_instalacoes')
  .select('*', { count: 'exact', head: true })
  .eq('concluida', true)
  .gte('concluida_em', dataLimite.toISOString());  // ← adicionar este filtro
```

Fazer o mesmo para neo_correções finalizadas (linhas 96-103):

```typescript
const { count: neoCorrecaoFinalizadaCount } = await supabase
  .from('neo_correcoes')
  .select('*', { count: 'exact', head: true })
  .eq('concluida', true)
  .gte('concluida_em', dataLimite.toISOString());  // ← adicionar este filtro
```

### Arquivo alterado
- `src/hooks/usePedidosEtapas.ts`

