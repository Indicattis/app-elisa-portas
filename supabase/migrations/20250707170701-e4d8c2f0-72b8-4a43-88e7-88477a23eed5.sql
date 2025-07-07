
-- Adicionar número de identificação sequencial para vendas
ALTER TABLE public.vendas ADD COLUMN numero_venda SERIAL;

-- Adicionar colunas de localização
ALTER TABLE public.vendas ADD COLUMN estado TEXT;
ALTER TABLE public.vendas ADD COLUMN cidade TEXT;
ALTER TABLE public.vendas ADD COLUMN bairro TEXT;
ALTER TABLE public.vendas ADD COLUMN cep TEXT;

-- Atualizar vendas existentes com número sequencial baseado na data
UPDATE public.vendas 
SET numero_venda = row_number() OVER (ORDER BY created_at);

-- Tornar as colunas de localização obrigatórias para novas vendas
ALTER TABLE public.vendas ALTER COLUMN estado SET NOT NULL;
ALTER TABLE public.vendas ALTER COLUMN cidade SET NOT NULL;
ALTER TABLE public.vendas ALTER COLUMN bairro SET NOT NULL;
ALTER TABLE public.vendas ALTER COLUMN cep SET NOT NULL;
