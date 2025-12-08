CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid, 
  p_etapa_destino text, 
  p_motivo_backlog text, 
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_etapa_atual TEXT;
BEGIN
  -- Buscar etapa atual do pedido (CORRIGIDO: etapa_atual ao invés de etapa)
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- Atualizar pedido para a etapa de destino e marcar como backlog
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino,
    em_backlog = true,
    motivo_backlog = p_motivo_backlog,
    data_backlog = NOW(),
    updated_at = NOW()
  WHERE id = p_pedido_id;

  -- Registrar movimentação como 'backlog'
  INSERT INTO pedidos_movimentacoes (
    pedido_id,
    etapa_origem,
    etapa_destino,
    teor,
    descricao,
    user_id,
    data_hora
  ) VALUES (
    p_pedido_id,
    v_etapa_atual,
    p_etapa_destino,
    'backlog',
    'BACKLOG: ' || p_motivo_backlog,
    p_user_id,
    NOW()
  );
END;
$function$;