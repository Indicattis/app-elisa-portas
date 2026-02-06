
-- Add aviso_espera fields to pedidos_producao
ALTER TABLE public.pedidos_producao 
ADD COLUMN IF NOT EXISTS aviso_espera text,
ADD COLUMN IF NOT EXISTS aviso_espera_data timestamptz;
