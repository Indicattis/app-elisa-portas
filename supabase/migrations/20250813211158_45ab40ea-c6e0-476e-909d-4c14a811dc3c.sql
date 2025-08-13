-- Add foreign key constraint between requisicoes_venda and orcamentos
ALTER TABLE public.requisicoes_venda 
ADD CONSTRAINT fk_requisicoes_venda_orcamento 
FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE CASCADE;