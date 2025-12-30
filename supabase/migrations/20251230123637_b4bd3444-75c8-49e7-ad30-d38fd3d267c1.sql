-- Remove versões duplicadas da função retroceder_pedido_para_etapa
-- Mantém apenas a versão correta: (p_pedido_id, p_etapa_destino, p_motivo_backlog, p_user_id)

-- Remove versão 3 (ordem diferente de parâmetros)
DROP FUNCTION IF EXISTS public.retroceder_pedido_para_etapa(uuid, text, uuid, text);

-- Remove versão 1 (antiga com 3 parâmetros)
DROP FUNCTION IF EXISTS public.retroceder_pedido_para_etapa(uuid, text, text);