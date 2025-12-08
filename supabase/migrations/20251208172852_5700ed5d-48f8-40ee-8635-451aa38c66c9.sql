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
  -- Buscar etapa atual do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- Se a etapa destino for "aberto", fazer reset completo
  IF p_etapa_destino = 'aberto' THEN
    -- 1. Excluir todas as linhas de ordens relacionadas ao pedido
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    
    -- 2. Excluir todas as ordens de produção do pedido
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_instalacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
    -- 3. Excluir instalações relacionadas
    DELETE FROM instalacoes_cadastradas WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    DELETE FROM entregas WHERE pedido_id = p_pedido_id;
    
    -- 4. Fechar todas as etapas abertas do pedido
    UPDATE pedidos_etapas 
    SET data_saida = NOW() 
    WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;
    
    -- 5. Criar nova etapa "aberto" com checkboxes padrão
    INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
    VALUES (
      p_pedido_id,
      'aberto',
      '[{"id": "check_producao_ok", "label": "Pedido está pronto para produção", "checked": false, "required": true}]'::jsonb
    );
    
    -- 6. Atualizar o pedido
    UPDATE pedidos_producao
    SET 
      etapa_atual = 'aberto',
      status = 'pendente',
      prioridade_etapa = 0,
      em_backlog = true,
      motivo_backlog = p_motivo_backlog,
      etapa_origem_backlog = v_etapa_atual,
      updated_at = NOW()
    WHERE id = p_pedido_id;
  ELSE
    -- Para outras etapas, apenas marcar como backlog
    UPDATE pedidos_producao
    SET 
      etapa_atual = p_etapa_destino,
      em_backlog = true,
      motivo_backlog = p_motivo_backlog,
      etapa_origem_backlog = v_etapa_atual,
      updated_at = NOW()
    WHERE id = p_pedido_id;
  END IF;

  -- Registrar movimentação
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