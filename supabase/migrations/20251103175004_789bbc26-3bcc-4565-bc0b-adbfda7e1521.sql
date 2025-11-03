-- Função para verificar se a ordem de pintura de um pedido está concluída
CREATE OR REPLACE FUNCTION public.verificar_ordem_pintura_concluida(p_pedido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  v_status TEXT;
BEGIN
  -- Buscar status da ordem de pintura
  SELECT status INTO v_status
  FROM ordens_pintura
  WHERE pedido_id = p_pedido_id
  LIMIT 1;
  
  -- Se não existe ordem de pintura, retorna false
  IF v_status IS NULL THEN
    RAISE LOG '[verificar_ordem_pintura_concluida] Nenhuma ordem de pintura encontrada para pedido: %', p_pedido_id;
    RETURN false;
  END IF;
  
  RAISE LOG '[verificar_ordem_pintura_concluida] Pedido: %, Status: %', p_pedido_id, v_status;
  
  -- Retorna true apenas se status é 'pronta'
  RETURN v_status = 'pronta';
END;
$function$;