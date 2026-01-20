-- 1. Criar ordens de pintura faltantes com numero_ordem gerado
INSERT INTO ordens_pintura (pedido_id, numero_ordem, status, metragem_quadrada)
SELECT 
  pp.id,
  'PINT-' || LPAD((COALESCE((SELECT MAX(CAST(SUBSTRING(numero_ordem FROM 6) AS INTEGER)) FROM ordens_pintura WHERE numero_ordem LIKE 'PINT-%'), 0) + ROW_NUMBER() OVER (ORDER BY pp.created_at))::TEXT, 5, '0'),
  'pendente',
  COALESCE((
    SELECT SUM(pv.quantidade * pv.largura * pv.altura)
    FROM produtos_vendas pv
    WHERE pv.venda_id = pp.venda_id
    AND pv.tipo_produto = 'porta_enrolar'
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
  ), 0)
FROM pedidos_producao pp
WHERE NOT EXISTS (
  SELECT 1 FROM ordens_pintura op WHERE op.pedido_id = pp.id
);

-- 2. Atualizar metragem_quadrada nas ordens de pintura existentes que estão zeradas
UPDATE ordens_pintura opin
SET metragem_quadrada = COALESCE((
  SELECT SUM(pv.quantidade * pv.largura * pv.altura)
  FROM pedidos_producao pp
  JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
  WHERE pp.id = opin.pedido_id 
  AND pv.tipo_produto = 'porta_enrolar'
  AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
), 0)
WHERE opin.metragem_quadrada IS NULL OR opin.metragem_quadrada = 0;

-- 3. Atualizar qtd_portas_p e qtd_portas_g nas ordens de soldagem
UPDATE ordens_soldagem os
SET 
  qtd_portas_p = COALESCE((
    SELECT SUM(
      CASE 
        WHEN (pv.largura * pv.altura) <= 25 THEN pv.quantidade 
        ELSE 0 
      END
    )
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
    AND pv.tipo_produto = 'porta_enrolar'
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
  ), 0),
  qtd_portas_g = COALESCE((
    SELECT SUM(
      CASE 
        WHEN (pv.largura * pv.altura) > 25 THEN pv.quantidade 
        ELSE 0 
      END
    )
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
    AND pv.tipo_produto = 'porta_enrolar'
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
  ), 0)
WHERE (os.qtd_portas_p = 0 AND os.qtd_portas_g = 0) 
   OR os.qtd_portas_p IS NULL 
   OR os.qtd_portas_g IS NULL;