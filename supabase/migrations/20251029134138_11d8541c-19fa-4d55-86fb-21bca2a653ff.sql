-- Atualizar pedidos existentes que estão em 'aberto' para 'em_producao'
-- pois eles já foram criados e devem estar em produção
UPDATE public.pedidos_producao 
SET etapa_atual = 'em_producao' 
WHERE etapa_atual = 'aberto' AND status != 'concluido';