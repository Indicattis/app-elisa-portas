
-- Deletar linhas das ordens de embalagem de pedidos sem pintura
DELETE FROM linhas_ordens
WHERE tipo_ordem = 'embalagem'
AND ordem_id IN (
  SELECT oe.id FROM ordens_embalagem oe
  JOIN pedidos_producao pp ON pp.id = oe.pedido_id
  LEFT JOIN vendas v ON v.id = pp.venda_id
  LEFT JOIN produtos_vendas pv ON pv.venda_id = v.id AND pv.valor_pintura > 0
  WHERE pv.id IS NULL AND oe.historico = false
);

-- Deletar ordens de embalagem de pedidos sem pintura
DELETE FROM ordens_embalagem
WHERE historico = false
AND id IN (
  SELECT oe.id FROM ordens_embalagem oe
  JOIN pedidos_producao pp ON pp.id = oe.pedido_id
  LEFT JOIN vendas v ON v.id = pp.venda_id
  LEFT JOIN produtos_vendas pv ON pv.venda_id = v.id AND pv.valor_pintura > 0
  WHERE pv.id IS NULL
);
