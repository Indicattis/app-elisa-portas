-- Atualizar vendas existentes: incrementar valor_venda com valor_credito
-- e zerar valor_credito para evitar contagem dupla no código
UPDATE vendas 
SET 
  valor_venda = valor_venda + COALESCE(valor_credito, 0),
  valor_credito = 0,
  updated_at = NOW()
WHERE valor_credito IS NOT NULL AND valor_credito > 0;