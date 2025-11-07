-- Adicionar campos de crédito (markup) na tabela produtos_vendas
ALTER TABLE produtos_vendas 
ADD COLUMN IF NOT EXISTS valor_credito numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentual_credito numeric DEFAULT 0;

COMMENT ON COLUMN produtos_vendas.valor_credito IS 'Valor adicional (markup) cobrado além do preço padrão da tabela';
COMMENT ON COLUMN produtos_vendas.percentual_credito IS 'Percentual de markup aplicado sobre o preço base';