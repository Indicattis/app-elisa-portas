-- Atualizar função para aceitar ambas as etapas de expedição
CREATE OR REPLACE FUNCTION public.concluir_carregamento_e_avancar_pedido(p_ordem_carregamento_id uuid)
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

  -- Buscar pedido associado à ordem de carregamento
  SELECT pedido_id INTO v_pedido_id
  FROM ordens_carregamento
  WHERE id = p_ordem_carregamento_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Ordem de carregamento não possui pedido associado';
  END IF;

  -- Verificar etapa do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;

  -- Aceitar tanto aguardando_coleta quanto aguardando_instalacao
  IF v_etapa_atual NOT IN ('aguardando_coleta', 'aguardando_instalacao') THEN
    RAISE EXCEPTION 'Pedido deve estar em "Aguardando Coleta" ou "Expedição Instalação" para concluir carregamento. Etapa atual: %', v_etapa_atual;
  END IF;

  -- Validar se todas as linhas foram coletadas
  SELECT COUNT(*) INTO v_linhas_total
  FROM pedido_linhas
  WHERE pedido_id = v_pedido_id;

  SELECT COUNT(*) INTO v_linhas_coletadas
  FROM pedido_linhas
  WHERE pedido_id = v_pedido_id AND check_coleta = true;

  IF v_linhas_coletadas < v_linhas_total THEN
    RAISE EXCEPTION 'Todas as linhas do pedido devem ser marcadas como coletadas antes de concluir o carregamento (% de % marcadas)', v_linhas_coletadas, v_linhas_total;
  END IF;

  -- Marcar ordem de carregamento como concluída
  UPDATE ordens_carregamento
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = v_user_id,
      status = 'concluida'
  WHERE id = p_ordem_carregamento_id;

  -- Registrar saída da etapa atual
  UPDATE pedidos_etapas
  SET data_saida = now()
  WHERE pedido_id = v_pedido_id
  AND etapa = v_etapa_atual
  AND data_saida IS NULL;

  -- Criar entrada na etapa finalizado
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
  VALUES (v_pedido_id, 'finalizado', now());

  -- Avançar pedido para finalizado
  UPDATE pedidos_producao
  SET 
    etapa_atual = 'finalizado',
    updated_at = now()
  WHERE id = v_pedido_id;

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'ordem_carregamento_id', p_ordem_carregamento_id,
    'message', 'Carregamento concluído e pedido finalizado com sucesso.'
  );
END;
$function$;