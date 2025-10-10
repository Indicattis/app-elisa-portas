-- Adicionar coluna preco_unitario na tabela estoque
ALTER TABLE public.estoque 
ADD COLUMN preco_unitario numeric DEFAULT 0 NOT NULL;