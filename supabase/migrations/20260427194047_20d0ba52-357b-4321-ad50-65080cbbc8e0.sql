INSERT INTO ordens_porta_social (pedido_id, numero_ordem, status, em_backlog, prioridade)
SELECT 
  pp.id,
  gerar_numero_ordem('porta_social'),
  'pendente',
  COALESCE(pp.em_backlog, false),
  COALESCE(pp.prioridade_etapa, 0)
FROM pedidos_producao pp
WHERE EXISTS (
    SELECT 1 FROM produtos_vendas pv
    WHERE pv.venda_id = pp.venda_id AND pv.tipo_produto = 'porta_social'
  )
  AND NOT EXISTS (
    SELECT 1 FROM ordens_porta_social ops WHERE ops.pedido_id = pp.id
  );