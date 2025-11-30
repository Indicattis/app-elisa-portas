-- Drop e recriar função de deletar pedido incluindo pontuacao_colaboradores
DROP FUNCTION IF EXISTS public.deletar_pedido_completo(uuid);

CREATE OR REPLACE FUNCTION public.deletar_pedido_completo(pedido_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o pedido existe
  IF NOT EXISTS (SELECT 1 FROM pedidos_producao WHERE id = pedido_uuid) THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- 1. Deletar pontuações dos colaboradores relacionadas às linhas
  DELETE FROM pontuacao_colaboradores 
  WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = pedido_uuid);
  
  -- 2. Deletar linhas de ordens
  DELETE FROM linhas_ordens WHERE pedido_id = pedido_uuid;
  
  -- 3. Deletar todas as ordens de produção
  DELETE FROM ordens_soldagem WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_perfiladeira WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_separacao WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_qualidade WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_pintura WHERE pedido_id = pedido_uuid;
  DELETE FROM ordens_carregamento WHERE pedido_id = pedido_uuid;
  
  -- 4. Deletar instalações e entregas
  DELETE FROM instalacoes WHERE pedido_id = pedido_uuid;
  DELETE FROM entregas WHERE pedido_id = pedido_uuid;
  
  -- 5. Deletar movimentações e etapas
  DELETE FROM pedidos_movimentacoes WHERE pedido_id = pedido_uuid;
  DELETE FROM pedidos_etapas WHERE pedido_id = pedido_uuid;
  
  -- 6. Deletar linhas do pedido
  DELETE FROM pedido_linhas WHERE pedido_id = pedido_uuid;
  
  -- 7. Finalmente deletar o pedido
  DELETE FROM pedidos_producao WHERE id = pedido_uuid;
END;
$function$;