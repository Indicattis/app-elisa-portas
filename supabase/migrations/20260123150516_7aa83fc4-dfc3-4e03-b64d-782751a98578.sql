-- Excluir ordens de pintura de pedidos que ainda não chegaram na etapa de pintura
-- Preservar ordens de pedidos que já estão na etapa aguardando_pintura ou posteriores

-- Primeiro, deletar as linhas de ordens associadas (se houver)
DELETE FROM linhas_ordens
WHERE ordem_id IN (
  SELECT op.id
  FROM ordens_pintura op
  JOIN pedidos_producao pp ON pp.id = op.pedido_id
  WHERE pp.etapa_atual IN ('aberto', 'em_producao', 'inspecao_qualidade')
);

-- Depois, deletar as ordens de pintura
DELETE FROM ordens_pintura
WHERE id IN (
  SELECT op.id
  FROM ordens_pintura op
  JOIN pedidos_producao pp ON pp.id = op.pedido_id
  WHERE pp.etapa_atual IN ('aberto', 'em_producao', 'inspecao_qualidade')
);