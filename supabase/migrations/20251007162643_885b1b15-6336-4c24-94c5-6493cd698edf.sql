-- Adicionar colunas de lucro agregado na tabela vendas
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS lucro_produto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lucro_pintura NUMERIC DEFAULT 0;