-- Adicionar coluna estoque_id à tabela linhas_ordens
ALTER TABLE public.linhas_ordens 
ADD COLUMN estoque_id UUID REFERENCES public.estoque(id);

-- Atualizar linhas existentes baseado no produto_venda_id (se houver relação via pedido_linhas)
UPDATE public.linhas_ordens lo
SET estoque_id = pl.estoque_id
FROM public.pedido_linhas pl
WHERE lo.produto_venda_id = pl.produto_venda_id
AND lo.pedido_id = pl.pedido_id
AND pl.estoque_id IS NOT NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_linhas_ordens_estoque_id ON public.linhas_ordens(estoque_id);