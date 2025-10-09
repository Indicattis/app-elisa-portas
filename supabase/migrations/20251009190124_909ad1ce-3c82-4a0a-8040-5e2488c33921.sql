-- Recalcular valor_venda para vendas existentes que não incluem frete
UPDATE vendas v
SET valor_venda = (
  SELECT COALESCE(SUM(pv.valor_total), 0)
  FROM portas_vendas pv
  WHERE pv.venda_id = v.id
) + COALESCE(v.valor_frete, 0)
WHERE v.valor_frete IS NOT NULL 
  AND v.valor_frete > 0
  AND v.valor_venda != (
    SELECT COALESCE(SUM(pv.valor_total), 0) + COALESCE(v.valor_frete, 0)
    FROM portas_vendas pv
    WHERE pv.venda_id = v.id
  );