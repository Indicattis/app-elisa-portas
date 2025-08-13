-- Remove orphaned records from requisicoes_venda that don't have a matching orcamento
DELETE FROM public.requisicoes_venda 
WHERE orcamento_id NOT IN (SELECT id FROM public.orcamentos);

-- Now add the foreign key constraint
ALTER TABLE public.requisicoes_venda 
ADD CONSTRAINT fk_requisicoes_venda_orcamento 
FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE CASCADE;