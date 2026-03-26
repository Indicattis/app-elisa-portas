-- Add pedido_correcao_id to produtos_vendas to identify correction items
ALTER TABLE public.produtos_vendas
  ADD COLUMN IF NOT EXISTS pedido_correcao_id uuid REFERENCES pedidos_producao(id) ON DELETE SET NULL;

-- Backfill: mark products that were created by correction orders
UPDATE public.produtos_vendas pv
SET pedido_correcao_id = pp.id
FROM pedidos_producao pp
WHERE pp.is_correcao = true
  AND pp.venda_id = pv.venda_id
  AND pv.created_at >= pp.created_at
  AND pv.pedido_correcao_id IS NULL;