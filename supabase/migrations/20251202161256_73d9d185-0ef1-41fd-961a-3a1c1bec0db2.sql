-- Adicionar campos de crédito na tabela vendas (a nível de venda)
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS valor_credito numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentual_credito numeric DEFAULT 0;