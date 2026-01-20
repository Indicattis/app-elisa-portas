-- 1. Popular largura/altura a partir do campo tamanho (formato "LxA")
UPDATE produtos_vendas
SET 
  largura = CAST(SPLIT_PART(REPLACE(REPLACE(tamanho, ',', '.'), ' ', ''), 'x', 1) AS NUMERIC),
  altura = CAST(SPLIT_PART(REPLACE(REPLACE(tamanho, ',', '.'), ' ', ''), 'x', 2) AS NUMERIC)
WHERE tipo_produto = 'porta_enrolar'
  AND tamanho IS NOT NULL
  AND tamanho LIKE '%x%'
  AND (largura IS NULL OR altura IS NULL);

-- 2. Recalcular qtd_portas_p e qtd_portas_g em ordens_soldagem
UPDATE ordens_soldagem os
SET 
  qtd_portas_p = COALESCE((
    SELECT SUM(CASE WHEN (pv.largura * pv.altura) <= 25 THEN pv.quantidade ELSE 0 END)
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
      AND pv.tipo_produto = 'porta_enrolar'
      AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
  ), 0),
  qtd_portas_g = COALESCE((
    SELECT SUM(CASE WHEN (pv.largura * pv.altura) > 25 THEN pv.quantidade ELSE 0 END)
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
      AND pv.tipo_produto = 'porta_enrolar'
      AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
  ), 0);

-- 3. Recalcular metragem_quadrada em ordens_pintura
UPDATE ordens_pintura opin
SET metragem_quadrada = COALESCE((
  SELECT SUM(pv.largura * pv.altura * pv.quantidade)
  FROM pedidos_producao pp
  JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
  WHERE pp.id = opin.pedido_id 
    AND pv.tipo_produto IN ('porta_enrolar', 'pintura_epoxi')
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
), 0);