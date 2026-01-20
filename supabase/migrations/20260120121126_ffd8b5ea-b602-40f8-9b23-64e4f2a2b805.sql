-- Corrigir metragem_quadrada nas ordens de pintura
-- Valores de largura/altura JÁ estão em metros
UPDATE ordens_pintura opin
SET metragem_quadrada = COALESCE((
  SELECT SUM(pv.quantidade * pv.largura * pv.altura)
  FROM pedidos_producao pp
  JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
  WHERE pp.id = opin.pedido_id 
  AND pv.tipo_produto = 'porta_enrolar'
  AND pv.largura IS NOT NULL 
  AND pv.altura IS NOT NULL
), 0);

-- Corrigir qtd_portas_p (≤ 25m²) e qtd_portas_g (> 25m²) nas ordens de soldagem
UPDATE ordens_soldagem os
SET 
  qtd_portas_p = COALESCE((
    SELECT SUM(pv.quantidade)
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
    AND pv.tipo_produto = 'porta_enrolar'
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
    AND (pv.largura * pv.altura) <= 25
  ), 0),
  qtd_portas_g = COALESCE((
    SELECT SUM(pv.quantidade)
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
    AND pv.tipo_produto = 'porta_enrolar'
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
    AND (pv.largura * pv.altura) > 25
  ), 0);