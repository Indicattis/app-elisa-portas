-- Adicionar campos de cliente à tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN cliente_nome text,
ADD COLUMN cliente_telefone text,
ADD COLUMN cliente_email text;

-- Comentários explicativos
COMMENT ON COLUMN public.vendas.cliente_nome IS 'Nome do cliente da venda';
COMMENT ON COLUMN public.vendas.cliente_telefone IS 'Telefone do cliente da venda';
COMMENT ON COLUMN public.vendas.cliente_email IS 'Email do cliente da venda';