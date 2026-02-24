
-- Cleanup: remove duplicate ordens_carregamento per pedido_id (keep the one with date or most recent)
DELETE FROM ordens_carregamento
WHERE id NOT IN (
  SELECT DISTINCT ON (pedido_id) id
  FROM ordens_carregamento
  WHERE pedido_id IS NOT NULL
  ORDER BY pedido_id, data_carregamento DESC NULLS LAST, created_at DESC
)
AND pedido_id IS NOT NULL
AND carregamento_concluido = false;

-- Cleanup: remove duplicate instalacoes per pedido_id (keep the one with date or most recent)
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
