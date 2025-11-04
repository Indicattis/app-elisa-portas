-- Atualizar RPC concluir_entrega_e_avancar_pedido com validação de checkboxes
CREATE OR REPLACE FUNCTION public.concluir_entrega_e_avancar_pedido(p_entrega_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id uuid;
  v_etapa_atual text;
  v_user_id uuid;
  v_linhas_total integer;
  v_linhas_coletadas integer;
BEGIN
  -- Obter user_id atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar pedido associado à entrega
  SELECT pedido_id INTO v_pedido_id
  FROM entregas
  WHERE id = p_entrega_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Entrega não possui pedido associado';
  END IF;

  -- Verificar etapa do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;

  IF v_etapa_atual != 'aguardando_coleta' THEN
    RAISE EXCEPTION 'Pedido deve estar em "Aguardando Coleta" para concluir entrega. Etapa atual: %', v_etapa_atual;
  END IF;

  -- Validar se todas as linhas foram coletadas
  SELECT COUNT(*) INTO v_linhas_total
  FROM pedido_linhas
  WHERE pedido_id = v_pedido_id;

  SELECT COUNT(*) INTO v_linhas_coletadas
  FROM pedido_linhas
  WHERE pedido_id = v_pedido_id AND check_coleta = true;

  IF v_linhas_coletadas < v_linhas_total THEN
    RAISE EXCEPTION 'Todas as linhas do pedido devem ser marcadas como coletadas antes de concluir a entrega (% de % marcadas)', v_linhas_coletadas, v_linhas_total;
  END IF;

  -- Marcar entrega como concluída
  UPDATE entregas
  SET entrega_concluida = true,
      entrega_concluida_em = now(),
      entrega_concluida_por = v_user_id,
      status = 'finalizada'
  WHERE id = p_entrega_id;

  -- NÃO avançar o pedido automaticamente
  -- O pedido permanece em 'aguardando_coleta' e deve ser avançado manualmente

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'entrega_id', p_entrega_id,
    'message', 'Entrega concluída. Use o botão "Avançar Etapa" para finalizar o pedido.'
  );
END;
$function$;