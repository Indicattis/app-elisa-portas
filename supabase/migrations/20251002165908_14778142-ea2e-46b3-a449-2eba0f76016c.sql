-- Adicionar coluna tipo_entrega na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN tipo_entrega text DEFAULT 'instalacao'::text;