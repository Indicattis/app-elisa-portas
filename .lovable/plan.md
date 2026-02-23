

# Corrigir contadores das abas Instalacoes e Correcoes

## Problema

Os contadores nas abas "Instalacoes" (61) e "Correcoes" (45) estao inflados porque incluem NEOs com `status = 'arquivada'`. A listagem exclui corretamente os arquivados, mas o hook de contagem nao.

Valores atuais vs corretos:
- Instalacoes: 61 (23 pedidos + 38 NEOs) -> deveria ser 41 (23 pedidos + 18 NEOs nao-arquivadas)
- Correcoes: 45 (4 pedidos + 41 NEOs) -> deveria ser 28 (4 pedidos + 24 NEOs nao-arquivadas)

## Correcao em `src/hooks/usePedidosEtapas.ts`

### Linha 64-68 - Contador de neo_instalacoes

Adicionar `.neq('status', 'arquivada')` na query:

```typescript
const { count: neoCount, error: neoError } = await supabase
  .from('neo_instalacoes')
  .select('*', { count: 'exact', head: true })
  .eq('concluida', false)
  .neq('status', 'arquivada');
```

### Linha 74-77 - Contador de neo_correcoes

Adicionar `.neq('status', 'arquivada')` na query:

```typescript
const { count: neoCorrecaoCount, error: neoCorrecaoError } = await supabase
  .from('neo_correcoes')
  .select('*', { count: 'exact', head: true })
  .eq('concluida', false)
  .neq('status', 'arquivada');
```

## Arquivo modificado

1. `src/hooks/usePedidosEtapas.ts` -- adicionar filtro `.neq('status', 'arquivada')` nas 2 queries de contagem de NEOs

