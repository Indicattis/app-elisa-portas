-- Excluir pedidos de vendas não faturadas (sem lucro_total ou custo_total definidos)
DELETE FROM pedidos_producao 
WHERE venda_id IN (
  SELECT id FROM vendas WHERE lucro_total IS NULL OR custo_total IS NULL
);