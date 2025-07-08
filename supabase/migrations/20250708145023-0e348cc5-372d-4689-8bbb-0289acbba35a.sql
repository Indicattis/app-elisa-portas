
-- Adicionar colunas de endereço na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN estado TEXT,
ADD COLUMN cidade TEXT,
ADD COLUMN bairro TEXT,
ADD COLUMN cep TEXT;
