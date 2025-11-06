-- Adicionar campo data_carregamento na tabela pedidos_producao
ALTER TABLE public.pedidos_producao 
ADD COLUMN IF NOT EXISTS data_carregamento DATE;

-- Comentário explicativo
COMMENT ON COLUMN public.pedidos_producao.data_carregamento IS 'Data de carregamento do pedido para expedição (obrigatória para finalizar)';