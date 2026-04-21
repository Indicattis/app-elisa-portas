-- Corrige desconto_valor duplicado em linhas resultantes de split de quantidade
WITH grupos AS (
  SELECT 
    venda_id, tipo_produto, valor_produto, valor_pintura, valor_instalacao, desconto_valor,
    COUNT(*) as n
  FROM produtos_vendas
  WHERE tipo_desconto = 'valor' 
    AND desconto_valor > 0
    AND quantidade = 1
  GROUP BY venda_id, tipo_produto, valor_produto, valor_pintura, valor_instalacao, desconto_valor
  HAVING COUNT(*) > 1
)
UPDATE produtos_vendas pv
SET desconto_valor = pv.desconto_valor / g.n
FROM grupos g
WHERE pv.venda_id = g.venda_id
  AND pv.tipo_produto = g.tipo_produto
  AND pv.valor_produto = g.valor_produto
  AND pv.valor_pintura = g.valor_pintura
  AND pv.valor_instalacao = g.valor_instalacao
  AND pv.desconto_valor = g.desconto_valor
  AND pv.tipo_desconto = 'valor'
  AND pv.quantidade = 1;