-- Recalcular lucro/custo do item específico após o backfill estrutural.
-- valor_total=1174.80, custo=6 × 20 × 5.34 = 640.80, lucro=534.00
UPDATE public.produtos_vendas
SET custo_producao = 640.80,
    lucro_item = 534.00
WHERE id = 'cb119f1f-2cc5-425c-9aba-a0295fd9daaa';