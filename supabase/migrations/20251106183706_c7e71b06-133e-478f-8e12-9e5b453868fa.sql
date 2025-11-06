-- Add quantidade_ideal column to estoque table
ALTER TABLE public.estoque 
ADD COLUMN quantidade_ideal integer DEFAULT 0;

COMMENT ON COLUMN public.estoque.quantidade_ideal IS 'Quantidade ideal/mínima que deve ser mantida em estoque';

-- Create index for better performance when filtering low stock products
CREATE INDEX idx_estoque_quantidade_status ON public.estoque(quantidade, quantidade_ideal) WHERE ativo = true;