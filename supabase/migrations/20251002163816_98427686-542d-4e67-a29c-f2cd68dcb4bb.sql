-- Adicionar coluna data_prevista_entrega na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN data_prevista_entrega date;