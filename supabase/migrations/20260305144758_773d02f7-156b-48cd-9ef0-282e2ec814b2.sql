
-- Passo 1: Atualizar lucro_item e custo_producao das portas de enrolar (Jan/Fev 2026)
-- com base nos valores da tabela de preços (tolerância 15cm)
UPDATE produtos_vendas pv
SET 
  lucro_item = matched.lucro * pv.quantidade,
  custo_producao = pv.valor_total - (matched.lucro * pv.quantidade)
FROM (
  SELECT DISTINCT ON (pv2.id) pv2.id as produto_id, tp.lucro
  FROM produtos_vendas pv2
  JOIN vendas v ON v.id = pv2.venda_id
  CROSS JOIN LATERAL (
    SELECT tp.lucro
    FROM tabela_precos_portas tp
    WHERE tp.ativo = true
      AND tp.largura >= (COALESCE(pv2.largura, SPLIT_PART(pv2.tamanho,'x',1)::numeric) - 0.15)
      AND tp.altura >= (COALESCE(pv2.altura, SPLIT_PART(pv2.tamanho,'x',2)::numeric) - 0.15)
    ORDER BY tp.largura, tp.altura
    LIMIT 1
  ) tp
  WHERE pv2.tipo_produto = 'porta_enrolar'
    AND v.created_at >= '2026-01-01'
    AND v.created_at < '2026-03-01'
) matched
WHERE pv.id = matched.produto_id;

-- Passo 2: Recalcular lucro_total e custo_total das vendas afetadas
UPDATE vendas v
SET 
  lucro_total = sub.soma_lucro + COALESCE(v.lucro_instalacao, 0),
  custo_total = sub.soma_custo + COALESCE(v.custo_instalacao, 0)
FROM (
  SELECT pv.venda_id, 
    SUM(pv.lucro_item) as soma_lucro,
    SUM(pv.custo_producao) as soma_custo
  FROM produtos_vendas pv
  GROUP BY pv.venda_id
) sub
WHERE v.id = sub.venda_id
  AND v.created_at >= '2026-01-01'
  AND v.created_at < '2026-03-01'
  AND v.frete_aprovado = true;
