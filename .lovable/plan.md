

# Fix: Unique constraint violation when rolling back pedido

## Problem

The `retroceder_pedido_unificado` database function fails with `duplicate key value violates unique constraint "pedidos_etapas_pedido_id_etapa_unique"` when rolling a pedido back to an etapa it has already visited (e.g., back to "aberto").

**Root cause**: Line 191-192 of the function uses a plain `INSERT INTO pedidos_etapas` which fails when a record for that `(pedido_id, etapa)` combination already exists.

## Solution

Replace the plain `INSERT` with an `INSERT ... ON CONFLICT` (upsert) that reactivates the existing etapa record instead of creating a duplicate.

### Database Migration

Update lines 191-192 of the function from:

```sql
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
VALUES (p_pedido_id, p_etapa_destino, now(), '[]'::jsonb);
```

To:

```sql
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
VALUES (p_pedido_id, p_etapa_destino, now(), '[]'::jsonb)
ON CONFLICT (pedido_id, etapa) DO UPDATE SET
  data_entrada = now(),
  data_saida = NULL,
  checkboxes = '[]'::jsonb;
```

This follows the existing upsert pattern already documented in the project's architecture (see memory note on `pedidos_etapas` integrity).

### Files changed

- **1 database migration**: Recreate `retroceder_pedido_unificado` function with the upsert fix. No frontend code changes needed.
