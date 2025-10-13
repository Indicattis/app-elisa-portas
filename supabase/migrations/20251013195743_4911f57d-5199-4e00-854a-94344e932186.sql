-- Corrigir o campo faturamento dos produtos
-- Resetar TODOS os produtos para faturamento = false inicialmente
UPDATE produtos_vendas
SET faturamento = false;

-- Marcar como true APENAS produtos em vendas que foram realmente faturadas
-- (vendas com frete aprovado E custo total definido)
UPDATE produtos_vendas
SET faturamento = true
WHERE venda_id IN (
  SELECT id FROM vendas 
  WHERE frete_aprovado = true 
  AND custo_total > 0
);