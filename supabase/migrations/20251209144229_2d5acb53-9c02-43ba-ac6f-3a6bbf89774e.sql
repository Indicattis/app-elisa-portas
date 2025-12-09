-- Adicionar colunas para documento do veículo
ALTER TABLE public.veiculos 
ADD COLUMN IF NOT EXISTS documento_url TEXT,
ADD COLUMN IF NOT EXISTS documento_nome TEXT;