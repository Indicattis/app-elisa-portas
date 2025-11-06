-- Adicionar coluna fornecedor_id na tabela estoque
ALTER TABLE public.estoque 
ADD COLUMN fornecedor_id uuid REFERENCES public.fornecedores(id);

-- Criar índice para melhorar performance
CREATE INDEX idx_estoque_fornecedor_id ON public.estoque(fornecedor_id);