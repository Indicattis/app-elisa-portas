-- Adicionar campos faltantes na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS publico_alvo text,
ADD COLUMN IF NOT EXISTS cliente_email text;