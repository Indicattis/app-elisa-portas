-- Backfill ordem_id para linhas de soldagem
UPDATE linhas_ordens lo
SET ordem_id = os.id
FROM ordens_soldagem os
WHERE lo.pedido_id = os.pedido_id
  AND lo.tipo_ordem = 'soldagem'
  AND lo.ordem_id IS NULL;

-- Backfill ordem_id para linhas de perfiladeira
UPDATE linhas_ordens lo
SET ordem_id = op.id
FROM ordens_perfiladeira op
WHERE lo.pedido_id = op.pedido_id
  AND lo.tipo_ordem = 'perfiladeira'
  AND lo.ordem_id IS NULL;

-- Backfill ordem_id para linhas de separação
UPDATE linhas_ordens lo
SET ordem_id = ose.id
FROM ordens_separacao ose
WHERE lo.pedido_id = ose.pedido_id
  AND lo.tipo_ordem = 'separacao'
  AND lo.ordem_id IS NULL;