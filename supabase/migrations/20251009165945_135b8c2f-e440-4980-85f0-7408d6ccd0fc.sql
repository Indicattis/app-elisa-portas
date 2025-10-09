-- Corrigir dados existentes onde tipo_produto = 'pintura_epoxi' 
-- mas o valor está incorretamente em valor_produto em vez de valor_pintura
UPDATE portas_vendas
SET 
  valor_pintura = valor_produto,
  valor_produto = 0,
  lucro_pintura = CASE 
    WHEN lucro_produto IS NOT NULL AND lucro_produto > 0 THEN 
      LEAST(lucro_produto, valor_produto)  -- Garantir que lucro não excede o valor
    WHEN lucro_pintura IS NOT NULL THEN lucro_pintura
    ELSE 0 
  END,
  lucro_produto = NULL
WHERE tipo_produto = 'pintura_epoxi' 
  AND valor_pintura = 0 
  AND valor_produto > 0;