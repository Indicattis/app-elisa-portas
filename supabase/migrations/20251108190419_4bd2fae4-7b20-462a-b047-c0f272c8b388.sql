-- Remover função existente
DROP FUNCTION IF EXISTS concluir_instalacao_e_avancar_pedido(uuid);

-- Função para concluir instalação e avançar o pedido
CREATE OR REPLACE FUNCTION concluir_instalacao_e_avancar_pedido(p_instalacao_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id uuid;
  v_etapa_atual text;
  v_result json;
BEGIN
  -- Buscar o pedido_id da instalação
  SELECT pedido_id INTO v_pedido_id
  FROM instalacoes_cadastradas
  WHERE id = p_instalacao_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Instalação não encontrada ou sem pedido associado';
  END IF;

  -- Marcar instalação como concluída
  UPDATE instalacoes_cadastradas
  SET 
    instalacao_concluida = true,
    instalacao_concluida_em = now(),
    instalacao_concluida_por = auth.uid()
  WHERE id = p_instalacao_id;

  -- Buscar etapa atual do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;

  -- Avançar pedido para finalizado
  UPDATE pedidos_producao
  SET 
    etapa_atual = 'finalizado',
    finalizado_em = now()
  WHERE id = v_pedido_id
  AND etapa_atual = 'aguardando_coleta';

  v_result := json_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'etapa_anterior', v_etapa_atual,
    'nova_etapa', 'finalizado'
  );

  RETURN v_result;
END;
$$;