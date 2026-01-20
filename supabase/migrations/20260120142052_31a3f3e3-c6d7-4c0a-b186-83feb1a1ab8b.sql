-- Migração: Finalizar remoção do sistema de pontuação

-- Dropar e recriar funções que precisam ser atualizadas
DROP FUNCTION IF EXISTS public.deletar_pedido_completo(UUID);

-- Recriar função deletar_pedido_completo sem referência a pontuação
CREATE OR REPLACE FUNCTION public.deletar_pedido_completo(p_pedido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Deletar linhas de ordens
  DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
  
  -- Deletar ordens de produção
  DELETE FROM ordens_producao WHERE pedido_id = p_pedido_id;
  
  -- Deletar linhas do pedido
  DELETE FROM pedido_linhas WHERE pedido_id = p_pedido_id;
  
  -- Deletar o pedido
  DELETE FROM pedidos_producao WHERE id = p_pedido_id;
  
  RETURN TRUE;
END;
$$;