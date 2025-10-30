-- Adicionar campo para identificar produtos vendidos avulsos
ALTER TABLE estoque 
ADD COLUMN comercializado_individualmente BOOLEAN NOT NULL DEFAULT false;

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_estoque_comercializado ON estoque(comercializado_individualmente) 
WHERE comercializado_individualmente = true AND ativo = true;

-- Comentário na coluna
COMMENT ON COLUMN estoque.comercializado_individualmente IS 
'Indica se o produto pode ser vendido individualmente como item avulso em vendas';