-- Adicionar colunas de custo e lucro à tabela produtos_vendas
ALTER TABLE public.produtos_vendas 
ADD COLUMN IF NOT EXISTS custo_producao numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_pintura numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS lucro_item numeric DEFAULT 0;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.produtos_vendas.custo_producao IS 'Custo de produção do item';
COMMENT ON COLUMN public.produtos_vendas.custo_pintura IS 'Custo de pintura do item (se aplicável)';
COMMENT ON COLUMN public.produtos_vendas.lucro_item IS 'Lucro calculado do item (valor - custos)';