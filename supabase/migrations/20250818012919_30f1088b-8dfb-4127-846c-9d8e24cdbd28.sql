-- Adicionar campo de email na tabela requisicoes_venda se não existir
ALTER TABLE public.requisicoes_venda 
ADD COLUMN IF NOT EXISTS cliente_email text;