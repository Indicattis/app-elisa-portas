-- 1) Data-fix: marcar linhas órfãs como concluídas para o pedido 0309
UPDATE linhas_ordens
SET concluida = true,
    concluida_em = COALESCE(concluida_em, now()),
    updated_at = now()
WHERE pedido_id = '08e4eddf-ca28-40c8-9b86-150db8fdf18b'
  AND tipo_ordem IN ('soldagem','perfiladeira')
  AND concluida = false;

-- 2) RPC para conclusão administrativa atômica de ordens
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
BEGIN
  -- Autorização: só admins ou operadores de fábrica
  IF NOT (public.is_admin() OR public.is_factory_operator(auth.uid())) THEN
    RAISE EXCEPTION 'Acesso negado: somente admins ou operadores de fábrica podem concluir ordens.';
  END IF;

  -- Mapear tipo_ordem -> tabela
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

  -- Marcar todas linhas pendentes como concluídas
  UPDATE linhas_ordens
  SET concluida = true,
      concluida_em = now(),
      concluida_por = auth.uid(),
      updated_at = now()
  WHERE ordem_id = p_ordem_id
    AND tipo_ordem = p_tipo_ordem
    AND concluida = false;

  GET DIAGNOSTICS v_linhas_atualizadas = ROW_COUNT;

  -- Concluir a ordem (UPDATE dinâmico)
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

GRANT EXECUTE ON FUNCTION public.concluir_ordem_administrativa(uuid, text, integer) TO authenticated;