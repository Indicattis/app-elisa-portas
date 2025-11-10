-- Corrigir função concluir_entrega_e_avancar_pedido removendo campo inexistente
CREATE OR REPLACE FUNCTION public.concluir_entrega_e_avancar_pedido(p_entrega_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Registrar saída da etapa atual
  UPDATE pedidos_etapas
  SET data_saida = now()
  WHERE pedido_id = v_pedido_id
  AND etapa = 'aguardando_coleta'
  AND data_saida IS NULL;

  -- Criar entrada na etapa finalizado
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
  VALUES (v_pedido_id, 'finalizado', now());

  -- Avançar pedido para finalizado (REMOVIDO campo finalizado_em que não existe)
  UPDATE pedidos_producao
  SET 
    etapa_atual = 'finalizado',
    updated_at = now()
  WHERE id = v_pedido_id;

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'entrega_id', p_entrega_id,
    'message', 'Entrega concluída e pedido finalizado com sucesso.'
  );
END;
$$;

-- Corrigir função concluir_instalacao_e_avancar_pedido removendo campo inexistente
CREATE OR REPLACE FUNCTION public.concluir_instalacao_e_avancar_pedido(p_instalacao_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Buscar pedido associado à instalação
  SELECT pedido_id INTO v_pedido_id
  FROM instalacoes_cadastradas
  WHERE id = p_instalacao_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Instalação não possui pedido associado';
  END IF;

  -- Verificar etapa do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;

  IF v_etapa_atual NOT IN ('aguardando_instalacao', 'aguardando_coleta') THEN
    RAISE EXCEPTION 'Pedido deve estar em "Aguardando Instalação" ou "Aguardando Coleta" para concluir instalação. Etapa atual: %', v_etapa_atual;
  END IF;

  -- Validar se todas as linhas foram coletadas
  SELECT COUNT(*) INTO v_linhas_total
  FROM pedido_linhas
  WHERE pedido_id = v_pedido_id;

  SELECT COUNT(*) INTO v_linhas_coletadas
  FROM pedido_linhas
  WHERE pedido_id = v_pedido_id AND check_coleta = true;

  IF v_linhas_coletadas < v_linhas_total THEN
    RAISE EXCEPTION 'Todas as linhas do pedido devem ser marcadas como coletadas antes de concluir a instalação (% de % marcadas)', v_linhas_coletadas, v_linhas_total;
  END IF;

  -- Marcar instalação como concluída
  UPDATE instalacoes_cadastradas
  SET instalacao_concluida = true,
      instalacao_concluida_em = now(),
      instalacao_concluida_por = v_user_id,
      status = 'finalizada'
  WHERE id = p_instalacao_id;

  -- Registrar saída da etapa atual
  UPDATE pedidos_etapas
  SET data_saida = now()
  WHERE pedido_id = v_pedido_id
  AND etapa IN ('aguardando_instalacao', 'aguardando_coleta')
  AND data_saida IS NULL;

  -- Criar entrada na etapa finalizado
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
  VALUES (v_pedido_id, 'finalizado', now());

  -- Avançar pedido para finalizado (REMOVIDO campo finalizado_em que não existe)
  UPDATE pedidos_producao
  SET 
    etapa_atual = 'finalizado',
    updated_at = now()
  WHERE id = v_pedido_id;

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'instalacao_id', p_instalacao_id,
    'message', 'Instalação concluída e pedido finalizado com sucesso.'
  );
END;
$$;