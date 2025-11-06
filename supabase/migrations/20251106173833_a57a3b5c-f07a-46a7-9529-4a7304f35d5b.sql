-- Renomear coluna preco_unitario para custo_unitario na tabela estoque
ALTER TABLE estoque 
RENAME COLUMN preco_unitario TO custo_unitario;