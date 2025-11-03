-- Add columns for installation completion tracking
ALTER TABLE instalacoes_cadastradas 
ADD COLUMN IF NOT EXISTS instalacao_concluida boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instalacao_concluida_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS instalacao_concluida_por uuid REFERENCES auth.users(id);

-- Create function to complete installation and advance pedido to finalizado
CREATE OR REPLACE FUNCTION concluir_instalacao_e_avancar_pedido(
  p_instalacao_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_etapa_atual text;
  v_user_id uuid;
  v_etapa_id uuid;
BEGIN
  -- Get current user_id
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Get pedido_id and validate
  SELECT pedido_id INTO v_pedido_id
  FROM instalacoes_cadastradas
  WHERE id = p_instalacao_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Instalação não possui pedido vinculado';
  END IF;

  -- Check pedido stage
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;

  IF v_etapa_atual != 'aguardando_instalacao' THEN
    RAISE EXCEPTION 'O pedido deve estar na etapa "Aguardando Instalação" para concluir a instalação. Etapa atual: %', v_etapa_atual;
  END IF;

  -- Mark installation as completed
  UPDATE instalacoes_cadastradas
  SET 
    instalacao_concluida = true,
    instalacao_concluida_em = now(),
    instalacao_concluida_por = v_user_id,
    status = 'finalizada'
  WHERE id = p_instalacao_id;

  -- Get current pedido stage (aguardando_instalacao)
  SELECT id INTO v_etapa_id
  FROM pedidos_etapas
  WHERE pedido_id = v_pedido_id 
    AND etapa = 'aguardando_instalacao'
    AND data_saida IS NULL
  LIMIT 1;

  -- Close current stage
  IF v_etapa_id IS NOT NULL THEN
    UPDATE pedidos_etapas
    SET data_saida = now()
    WHERE id = v_etapa_id;
  END IF;

  -- Create new 'finalizado' stage
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
  VALUES (v_pedido_id, 'finalizado', '[]'::jsonb, now());

  -- Update pedido to finalizado stage
  UPDATE pedidos_producao
  SET 
    etapa_atual = 'finalizado',
    status = 'concluido',
    prioridade_etapa = 0,
    updated_at = now()
  WHERE id = v_pedido_id;

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'instalacao_id', p_instalacao_id
  );
END;
$$;