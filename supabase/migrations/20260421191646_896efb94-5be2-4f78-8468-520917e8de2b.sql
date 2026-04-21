-- 1. Produtos do tipo 'instalacao' (vendas novas) faturados em 2026
WITH alvo AS (
  SELECT pv.id, pv.valor_total_sem_frete
  FROM produtos_vendas pv
  JOIN vendas v ON v.id = pv.venda_id
  WHERE pv.tipo_produto = 'instalacao'
    AND pv.faturamento = true
    AND v.data_venda >= '2026-01-01'
    AND v.data_venda < '2027-01-01'
)
UPDATE produtos_vendas pv
SET 
  lucro_item = ROUND((alvo.valor_total_sem_frete * 0.40)::numeric, 2),
  custo_producao = ROUND((alvo.valor_total_sem_frete * 0.60)::numeric, 2)
FROM alvo
WHERE pv.id = alvo.id;

-- 2. Vendas legadas: instalação no nível da venda (sem produto 'instalacao')
WITH legadas AS (
  SELECT v.id, v.valor_instalacao
  FROM vendas v
  WHERE v.data_venda >= '2026-01-01'
    AND v.data_venda < '2027-01-01'
    AND v.instalacao_faturada = true
    AND COALESCE(v.valor_instalacao, 0) > 0
    AND NOT EXISTS (
      SELECT 1 FROM produtos_vendas pv 
      WHERE pv.venda_id = v.id AND pv.tipo_produto = 'instalacao'
    )
)
UPDATE vendas v
SET 
  lucro_instalacao = ROUND((legadas.valor_instalacao * 0.40)::numeric, 2),
  custo_instalacao = ROUND((legadas.valor_instalacao * 0.60)::numeric, 2)
FROM legadas
WHERE v.id = legadas.id;

-- 3. Recalcular lucro_total e custo_total das vendas afetadas em 2026
UPDATE vendas v
SET 
  lucro_total = COALESCE((
    SELECT SUM(COALESCE(pv.lucro_item, 0))
    FROM produtos_vendas pv
    WHERE pv.venda_id = v.id AND pv.faturamento = true
  ), 0) + COALESCE(v.lucro_instalacao, 0),
  custo_total = COALESCE((
    SELECT SUM(COALESCE(pv.custo_producao, 0))
    FROM produtos_vendas pv
    WHERE pv.venda_id = v.id AND pv.faturamento = true
  ), 0) + COALESCE(v.custo_instalacao, 0)
WHERE v.data_venda >= '2026-01-01'
  AND v.data_venda < '2027-01-01'
  AND v.frete_aprovado = true;