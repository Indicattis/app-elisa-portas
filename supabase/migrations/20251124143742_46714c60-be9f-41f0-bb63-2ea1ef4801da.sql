-- Adicionar campo requer_pintura na tabela estoque
ALTER TABLE public.estoque 
ADD COLUMN IF NOT EXISTS requer_pintura BOOLEAN DEFAULT false;