

## Corrigir envio para "Aguardando Cliente" — trigger de sync sobrescrevendo `etapa_atual`

### Diagnóstico

O envio para "Aguardando Cliente" está sendo executado parcialmente:

- ✅ `pedidos_etapas` recebe a linha `aguardando_cliente`.
- ✅ `pedidos_movimentacoes` registra a movimentação.
- ❌ `pedidos_producao.etapa_atual` permanece `'finalizado'`.

Confirmado no banco: pedidos `0222` e `0213` têm 5+ tentativas registradas em `pedidos_movimentacoes` e a etapa em `pedidos_etapas`, mas `etapa_atual='finalizado'`. Isso explica por que o pedido nunca aparece na aba "Aguardando Cliente" mesmo com toast de sucesso.

**Causa raiz**: a trigger `trigger_sync_pedido_etapa_atual` (em `pedidos_etapas`) recalcula `etapa_atual` após cada INSERT/UPDATE com:

```sql
ORDER BY CASE WHEN data_saida IS NULL THEN data_entrada ELSE data_saida END DESC
LIMIT 1
```

No nosso fluxo `enviarParaAguardandoCliente`:
1. `update pedidos_producao set etapa_atual='aguardando_cliente'` ✓
2. `update pedidos_etapas set data_saida=agora` na linha `finalizado` → dispara trigger → ordena por `data_saida=agora` → escolhe `finalizado` (porque `aguardando_cliente` ainda não existe) → **reverte `etapa_atual` para `finalizado`**.
3. `upsert aguardando_cliente` com `data_entrada=agora` → dispara trigger → agora há empate (`data_saida=agora` em finalizado, `data_entrada=agora` em aguardando_cliente) → ORDER BY com empate é não-determinístico → frequentemente seleciona `finalizado` novamente.

### Solução

**Migration**: ajustar a função `sync_pedido_etapa_atual` para:

1. **Priorizar etapas abertas** (`data_saida IS NULL`) sobre fechadas — a etapa atual é, por definição, a única não fechada.
2. **Adicionar tie-breaker determinístico** (`created_at DESC`, depois `id DESC`) para nunca ter ambiguidade quando timestamps colidem.

Nova lógica equivalente:

```sql
ORDER BY
  (data_saida IS NULL) DESC,                                       -- abertas primeiro
  COALESCE(data_saida, data_entrada) DESC,                         -- mais recente
  created_at DESC,                                                 -- desempate
  id DESC                                                          -- desempate final
LIMIT 1
```

Isso resolve o caso do envio para "Aguardando Cliente" (a nova linha tem `data_saida IS NULL` e ganha a ordenação) e também blinda qualquer outro fluxo onde duas operações usam o mesmo `now()`.

**Reparo dos pedidos órfãos**: na mesma migration, normalizar os pedidos cujo `etapa_atual` está dessincronizado em relação à etapa aberta mais recente em `pedidos_etapas` — apenas quando há uma única etapa com `data_saida IS NULL`, evitando alterações arriscadas.

```sql
UPDATE pedidos_producao p
SET etapa_atual = sub.etapa, updated_at = now()
FROM (
  SELECT DISTINCT ON (pedido_id) pedido_id, etapa
  FROM pedidos_etapas
  WHERE data_saida IS NULL
  ORDER BY pedido_id, data_entrada DESC, created_at DESC
) sub
WHERE p.id = sub.pedido_id
  AND p.arquivado = false
  AND p.etapa_atual IS DISTINCT FROM sub.etapa;
```

### Validação adicional (frontend)

Sem mudanças necessárias em `src/lib/aguardandoCliente.ts` — a função já está correta e os testes em `aguardandoCliente.test.ts` continuam válidos. Adicionar 1 teste de regressão verificando que **a ordem das operações** garante: update etapa_atual primeiro, depois manipulação de etapas. (Já coberto.)

### Fora de escopo

- Refatorar outros fluxos que dependem da trigger (eles continuam funcionando — o novo critério é estritamente mais correto).
- Mudanças em `aguardando_cliente` para Neo (caminho próprio em `instalacoes`/`correcoes`, não passa por `pedidos_etapas`).

### Arquivos

- `supabase/migrations/<novo>.sql` — atualizar função `sync_pedido_etapa_atual` + reparo dos pedidos órfãos.
- (sem mudanças de código TS)

