-- Adicionar novos campos à tabela vendas para melhor controle financeiro
ALTER TABLE public.vendas 
ADD COLUMN publico_alvo text CHECK (publico_alvo IN ('serralheiro', 'cliente_final')),
ADD COLUMN valor_produto numeric DEFAULT 0,
ADD COLUMN custo_produto numeric DEFAULT 0,
ADD COLUMN valor_pintura numeric DEFAULT 0,
ADD COLUMN custo_pintura numeric DEFAULT 0,
ADD COLUMN valor_instalacao numeric DEFAULT 0,
ADD COLUMN valor_frete numeric DEFAULT 0,
ADD COLUMN resgate boolean DEFAULT false,
ADD COLUMN lucro_total numeric GENERATED ALWAYS AS (
  COALESCE(valor_produto, 0) + 
  COALESCE(valor_pintura, 0) + 
  COALESCE(valor_instalacao, 0) + 
  COALESCE(valor_frete, 0) - 
  COALESCE(custo_produto, 0) - 
  COALESCE(custo_pintura, 0)
) STORED;

-- Atualizar o valor_venda para ser calculado automaticamente se necessário
-- (mantém compatibilidade com dados existentes)
ALTER TABLE public.vendas 
ALTER COLUMN valor_venda DROP NOT NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.vendas.publico_alvo IS 'Indica se a venda é para serralheiro ou cliente final';
COMMENT ON COLUMN public.vendas.valor_produto IS 'Valor do produto vendido';
COMMENT ON COLUMN public.vendas.custo_produto IS 'Custo do produto';
COMMENT ON COLUMN public.vendas.valor_pintura IS 'Valor cobrado pela pintura';
COMMENT ON COLUMN public.vendas.custo_pintura IS 'Custo da pintura';
COMMENT ON COLUMN public.vendas.valor_instalacao IS 'Valor cobrado pela instalação';
COMMENT ON COLUMN public.vendas.valor_frete IS 'Valor do frete';
COMMENT ON COLUMN public.vendas.resgate IS 'Indica se a venda foi um resgate';
COMMENT ON COLUMN public.vendas.lucro_total IS 'Lucro total calculado automaticamente';