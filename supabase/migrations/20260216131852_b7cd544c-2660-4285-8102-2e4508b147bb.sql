CREATE OR REPLACE FUNCTION public.verificar_ordem_pintura_concluida(p_pedido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM ordens_pintura
  WHERE pedido_id = p_pedido_id
  LIMIT 1;
  
  IF v_status IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN v_status IN ('pronta', 'concluido');
END;
$function$;