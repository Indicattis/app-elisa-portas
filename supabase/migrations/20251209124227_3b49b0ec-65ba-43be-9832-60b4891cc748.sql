CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid,
  p_etapa_destino text,
  p_motivo_backlog text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_etapa_atual text;
  v_etapas_possiveis text[] := ARRAY['aberto', 'em_producao', 'inspecao_qualidade', 'aguardando_pintura', 'aguardando_carregamento', 'aguardando_instalacao', 'concluido'];
  v_idx_atual integer;
  v_idx_destino integer;
BEGIN
  -- Get current stage
  SELECT etapa INTO v_etapa_atual
  FROM pedidos_etapas
  WHERE pedido_id = p_pedido_id AND data_saida IS NULL
  LIMIT 1;

  IF v_etapa_atual IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado ou sem etapa ativa');
  END IF;

  -- Validate destination is before current
  v_idx_atual := array_position(v_etapas_possiveis, v_etapa_atual);
  v_idx_destino := array_position(v_etapas_possiveis, p_etapa_destino);

  IF v_idx_destino IS NULL OR v_idx_atual IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Etapa inválida');
  END IF;

  IF v_idx_destino >= v_idx_atual THEN
    RETURN jsonb_build_object('success', false, 'error', 'A etapa de destino deve ser anterior à etapa atual');
  END IF;

  -- Close current stage
  UPDATE pedidos_etapas
  SET data_saida = NOW()
  WHERE pedido_id = p_pedido_id AND data_saida IS NULL;

  -- Create new stage entry
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
  VALUES (p_pedido_id, p_etapa_destino, NOW());

  -- Update pedidos_producao with backlog info
  UPDATE pedidos_producao
  SET etapa_atual = p_etapa_destino, 
      em_backlog = true, 
      motivo_backlog = p_motivo_backlog,
      etapa_origem_backlog = v_etapa_atual,
      updated_at = NOW()
  WHERE id = p_pedido_id;

  -- Record movement
  INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao, data_hora)
  VALUES (p_pedido_id, p_user_id, v_etapa_atual, p_etapa_destino, 'retrocesso', p_motivo_backlog, NOW());

  RETURN jsonb_build_object('success', true);
END;
$$;