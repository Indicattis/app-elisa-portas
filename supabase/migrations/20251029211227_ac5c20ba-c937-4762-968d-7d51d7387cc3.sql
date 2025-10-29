-- Adicionar colunas largura e altura na tabela produtos_vendas
ALTER TABLE produtos_vendas 
ADD COLUMN IF NOT EXISTS largura numeric,
ADD COLUMN IF NOT EXISTS altura numeric;