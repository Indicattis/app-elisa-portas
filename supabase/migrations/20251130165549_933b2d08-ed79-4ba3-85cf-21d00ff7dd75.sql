-- Função para deletar pedido e todas as suas ordens relacionadas
CREATE OR REPLACE FUNCTION public.deletar_pedido_completo(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar todas as ordens relacionadas
  DELETE FROM public.ordens_soldagem WHERE pedido_id = p_pedido_id;
  DELETE FROM public.ordens_perfiladeira WHERE pedido_id = p_pedido_id;
  DELETE FROM public.ordens_separacao WHERE pedido_id = p_pedido_id;
  DELETE FROM public.ordens_qualidade WHERE pedido_id = p_pedido_id;
  DELETE FROM public.ordens_pintura WHERE pedido_id = p_pedido_id;
  DELETE FROM public.ordens_carregamento WHERE pedido_id = p_pedido_id;
  DELETE FROM public.instalacoes WHERE pedido_id = p_pedido_id;
  DELETE FROM public.entregas WHERE pedido_id = p_pedido_id;
  
  -- Deletar linhas de ordens
  DELETE FROM public.linhas_ordens WHERE pedido_id = p_pedido_id;
  
  -- Deletar registros de etapas
  DELETE FROM public.pedidos_etapas WHERE pedido_id = p_pedido_id;
  
  -- Deletar movimentações
  DELETE FROM public.pedidos_movimentacoes WHERE pedido_id = p_pedido_id;
  
  -- Deletar o pedido
  DELETE FROM public.pedidos_producao WHERE id = p_pedido_id;
END;
$$;