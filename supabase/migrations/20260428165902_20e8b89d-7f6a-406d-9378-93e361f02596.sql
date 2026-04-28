CREATE OR REPLACE FUNCTION public.concluir_ordem_administrativa(
  p_ordem_id uuid,
  p_tipo_ordem text,
  p_tempo_segundos integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_linhas_atualizadas integer := 0;
  v_table_name text;
  v_is_authorized boolean;
BEGIN
  -- Autorização: qualquer admin_user ativo (controle real é por permissão de rota)
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado a concluir ordens.';
  END IF;

  v_table_name := CASE p_tipo_ordem
    WHEN 'soldagem' THEN 'ordens_soldagem'
    WHEN 'perfiladeira' THEN 'ordens_perfiladeira'
    WHEN 'separacao' THEN 'ordens_separacao'
    WHEN 'qualidade' THEN 'ordens_qualidade'
    WHEN 'pintura' THEN 'ordens_pintura'
    WHEN 'embalagem' THEN 'ordens_embalagem'
    ELSE NULL
  END;

  IF v_table_name IS NULL THEN
    RAISE EXCEPTION 'Tipo de ordem inválido: %', p_tipo_ordem;
  END IF;

  UPDATE linhas_ordens
  SET concluida = true,
      concluida_em = now(),
      concluida_por = auth.uid(),
      updated_at = now()
  WHERE ordem_id = p_ordem_id
    AND tipo_ordem = p_tipo_ordem
    AND concluida = false;

  GET DIAGNOSTICS v_linhas_atualizadas = ROW_COUNT;

  EXECUTE format(
    'UPDATE %I SET status = %L, historico = true, data_conclusao = now(), tempo_conclusao_segundos = COALESCE($1, tempo_conclusao_segundos) WHERE id = $2',
    v_table_name, 'concluido'
  ) USING p_tempo_segundos, p_ordem_id;

  RETURN jsonb_build_object(
    'linhas_atualizadas', v_linhas_atualizadas,
    'tipo_ordem', p_tipo_ordem,
    'ordem_id', p_ordem_id
  );
END;
$$;