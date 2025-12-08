-- Add new fields to instalacoes table for better location and client info
ALTER TABLE public.instalacoes 
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS estado text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS telefone_cliente text,
ADD COLUMN IF NOT EXISTS cor_id uuid REFERENCES public.catalogo_cores(id);

-- Add index for cor_id foreign key
CREATE INDEX IF NOT EXISTS idx_instalacoes_cor_id ON public.instalacoes(cor_id);