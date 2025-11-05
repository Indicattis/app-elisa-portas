-- Update all existing vendas to set venda_presencial = false
UPDATE public.vendas 
SET venda_presencial = false 
WHERE venda_presencial IS NULL OR venda_presencial = true;