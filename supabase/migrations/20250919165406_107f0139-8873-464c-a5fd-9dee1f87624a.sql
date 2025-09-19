-- Add numero_vendas column to contador_vendas_dias table
ALTER TABLE public.contador_vendas_dias 
ADD COLUMN numero_vendas integer NOT NULL DEFAULT 0;