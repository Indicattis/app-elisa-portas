

# Correção: Pedidos com ordens duplicadas mostram "Não agendado" e carregamento incompleto

## Problema identificado

Existem registros duplicados nas tabelas `ordens_carregamento` e `instalacoes` para o mesmo `pedido_id`:

- **Pedido 0217** (aguardando_coleta): 3 registros em `ordens_carregamento` -- 2 com data 2026-02-28 e 1 sem data
- **Pedido 0093** (instalacoes): 4 registros em `ordens_carregamento` + 4 registros em `instalacoes`, todos sem data

Isso causa dois problemas:

1. **PedidoCard mostra "Nao agendado"**: O componente usa `.maybeSingle()` para buscar a ordem. Quando existem multiplos registros para o mesmo pedido, `.maybeSingle()` retorna `null` (por design do PostgREST -- espera 0 ou 1 resultado). Resultado: `temData = false` e aparece "Nao agendado" mesmo com ordens no calendario.

2. **`/producao/carregamento` mostra poucas ordens**: O hook `useOrdensCarregamentoUnificadas` deduplica por `pedido_id`, mantendo apenas 1 registro por pedido. Os duplicatas sao descartados.

## Solucao

### 1. Limpar dados duplicados (SQL via Supabase)

Remover os registros duplicados mantendo o mais relevante (com data agendada, ou o mais recente):

```text
-- Para ordens_carregamento: manter apenas 1 por pedido_id (a que tem data ou a mais recente)
-- Para instalacoes: manter apenas 1 por pedido_id
```

### 2. Corrigir PedidoCard.tsx -- substituir `.maybeSingle()` por logica robusta

Na query de carregamento do `PedidoCard`, trocar `.maybeSingle()` por `.order('data_carregamento', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()` nas 3 consultas (correcoes, instalacoes, ordens_carregamento). Isso garante que, se houver duplicatas no futuro, o registro com data sera priorizado.

Alternativa mais segura: usar `.select(...)` sem `.maybeSingle()`, receber array, e selecionar o melhor registro no codigo (priorizar o que tem `data_carregamento`).

### 3. Invalidar cache apos limpeza

Apos limpar duplicatas, invalidar as queries para atualizar a interface.

## Detalhes tecnicos

### Arquivo: `src/components/pedidos/PedidoCard.tsx`

Linhas ~422-460: Substituir as 3 chamadas `.maybeSingle()` por uma logica que busca todos os registros do pedido e seleciona o mais relevante:

```text
// Antes (linha ~444-448):
const { data: ordemCarregamento } = await supabase
  .from('ordens_carregamento')
  .select('data_carregamento, carregamento_concluido, ...')
  .eq('pedido_id', pedido.id)
  .maybeSingle();

// Depois:
const { data: ordensCarregamento } = await supabase
  .from('ordens_carregamento')
  .select('data_carregamento, carregamento_concluido, ...')
  .eq('pedido_id', pedido.id)
  .eq('carregamento_concluido', false)
  .order('data_carregamento', { ascending: false, nullsFirst: false })
  .limit(1);

const ordemCarregamento = ordensCarregamento?.[0] || null;
```

Aplicar o mesmo padrao para as consultas de `instalacoes` (linha ~422-426) e `correcoes` (linha ~401-405).

### Limpeza de dados SQL

Executar queries para remover duplicatas:

```text
-- Remover ordens_carregamento duplicadas por pedido_id (manter a com data ou mais recente)
DELETE FROM ordens_carregamento
WHERE id NOT IN (
  SELECT DISTINCT ON (pedido_id) id
  FROM ordens_carregamento
  WHERE pedido_id IS NOT NULL
  ORDER BY pedido_id, data_carregamento DESC NULLS LAST, created_at DESC
)
AND pedido_id IS NOT NULL
AND carregamento_concluido = false;

-- Mesmo para instalacoes duplicadas
DELETE FROM instalacoes
WHERE id NOT IN (
  SELECT DISTINCT ON (pedido_id) id
  FROM instalacoes
  WHERE pedido_id IS NOT NULL
  ORDER BY pedido_id, data_carregamento DESC NULLS LAST, created_at DESC
)
AND pedido_id IS NOT NULL
AND carregamento_concluido = false
AND instalacao_concluida = false;
```

## Resultado esperado

- PedidoCard mostrara corretamente "Agendado" para pedidos com ordens no calendario
- `/producao/carregamento` mostrara o numero correto de ordens
- Dados duplicados serao limpos
- Codigo ficara resiliente a duplicatas futuras
