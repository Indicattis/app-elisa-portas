-- Adicionar coluna SKU na tabela vendas_catalogo
ALTER TABLE public.vendas_catalogo
ADD COLUMN sku TEXT;

-- Criar índice para buscas por SKU
CREATE INDEX idx_vendas_catalogo_sku ON public.vendas_catalogo(sku);