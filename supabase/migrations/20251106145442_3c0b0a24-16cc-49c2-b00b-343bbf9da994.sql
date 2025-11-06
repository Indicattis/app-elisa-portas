-- Remove coluna comercializado_individualmente da tabela estoque
ALTER TABLE public.estoque 
DROP COLUMN IF EXISTS comercializado_individualmente;