-- Add nota_fiscal column to vendas table
ALTER TABLE public.vendas 
ADD COLUMN nota_fiscal boolean NOT NULL DEFAULT true;