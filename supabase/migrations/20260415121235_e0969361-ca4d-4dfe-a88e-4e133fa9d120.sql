
-- Move pedidos da etapa aprovacao_diretor para aberto
UPDATE public.pedidos_producao
SET etapa_atual = 'aberto', status = 'aberto'
WHERE etapa_atual = 'aprovacao_diretor'
  AND arquivado = false;

-- Criar registro de etapa 'aberto' para os pedidos movidos (se não existir)
INSERT INTO public.pedidos_etapas (pedido_id, etapa, checkboxes)
SELECT pp.id, 'aberto', '[]'::jsonb
FROM public.pedidos_producao pp
WHERE pp.etapa_atual = 'aberto'
  AND pp.arquivado = false
  AND NOT EXISTS (
    SELECT 1 FROM public.pedidos_etapas pe
    WHERE pe.pedido_id = pp.id AND pe.etapa = 'aberto'
  );
