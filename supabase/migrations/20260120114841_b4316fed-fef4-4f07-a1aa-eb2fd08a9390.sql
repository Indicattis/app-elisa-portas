-- Adicionar metragem_linear em ordens_perfiladeira
ALTER TABLE ordens_perfiladeira 
ADD COLUMN IF NOT EXISTS metragem_linear NUMERIC DEFAULT 0;

-- Adicionar metragem_quadrada em ordens_pintura
ALTER TABLE ordens_pintura 
ADD COLUMN IF NOT EXISTS metragem_quadrada NUMERIC DEFAULT 0;

-- Adicionar contagem de portas em ordens_soldagem
ALTER TABLE ordens_soldagem 
ADD COLUMN IF NOT EXISTS qtd_portas_p INTEGER DEFAULT 0;

ALTER TABLE ordens_soldagem 
ADD COLUMN IF NOT EXISTS qtd_portas_g INTEGER DEFAULT 0;

-- Popular metragem_linear nas ordens de perfiladeira existentes
UPDATE ordens_perfiladeira op
SET metragem_linear = COALESCE((
  SELECT SUM(lo.quantidade * COALESCE(NULLIF(REPLACE(lo.tamanho, ',', '.'), '')::numeric, 0))
  FROM linhas_ordens lo 
  WHERE lo.ordem_id = op.id
), 0);

-- Popular metragem_quadrada nas ordens de pintura existentes
-- Nota: largura e altura estão em cm, então dividimos por 10000 para m²
UPDATE ordens_pintura opin
SET metragem_quadrada = COALESCE((
  SELECT SUM(pv.quantidade * (pv.largura / 100.0) * (pv.altura / 100.0))
  FROM pedidos_producao pp
  JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
  WHERE pp.id = opin.pedido_id 
  AND pv.tipo_produto = 'porta_enrolar'
  AND pv.largura IS NOT NULL 
  AND pv.altura IS NOT NULL
), 0);

-- Popular qtd_portas_p e qtd_portas_g nas ordens de soldagem existentes
-- P = área <= 9m², G = área > 9m²
UPDATE ordens_soldagem os
SET 
  qtd_portas_p = COALESCE((
    SELECT SUM(pv.quantidade)
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
    AND pv.tipo_produto = 'porta_enrolar'
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
    AND ((pv.largura / 100.0) * (pv.altura / 100.0)) <= 9
  ), 0),
  qtd_portas_g = COALESCE((
    SELECT SUM(pv.quantidade)
    FROM pedidos_producao pp
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
    WHERE pp.id = os.pedido_id 
    AND pv.tipo_produto = 'porta_enrolar'
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
    AND ((pv.largura / 100.0) * (pv.altura / 100.0)) > 9
  ), 0);