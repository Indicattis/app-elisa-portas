-- Adicionar coluna cliente_id na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN cliente_id uuid REFERENCES public.clientes(id);

-- Criar índice para melhor performance nas buscas
CREATE INDEX idx_vendas_cliente_id ON public.vendas(cliente_id);