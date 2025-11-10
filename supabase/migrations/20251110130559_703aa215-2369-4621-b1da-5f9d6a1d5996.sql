-- Ajustar função retroceder_pedido_para_etapa: excluir apenas qualidade e pintura
CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(p_pedido_id uuid, p_etapa_destino text, p_motivo_backlog text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_etapa_atual text;
  v_max_prioridade integer;
BEGIN
  -- Obter etapa atual
  SELECT etapa_atual INTO v_etapa_atual 
  FROM pedidos_producao 
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_pedido_id;
  END IF;

  -- Obter maior prioridade da etapa de destino
  SELECT COALESCE(MAX(prioridade_etapa), 0) INTO v_max_prioridade
  FROM pedidos_producao 
  WHERE etapa_atual = p_etapa_destino;

  RAISE LOG '[retroceder] Pedido: %, Etapa atual: %, Destino: %', p_pedido_id, v_etapa_atual, p_etapa_destino;

  -- ========================================
  -- CASO 1: Retroceder para "aberto"
  -- ========================================
  IF p_etapa_destino = 'aberto' THEN
    RAISE LOG '[retroceder] CASO 1: Excluindo TUDO (ordens, linhas, instalações, entregas)';
    
    -- Excluir linhas de ordens primeiro (FK constraint)
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    
    -- Excluir todas as ordens
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    
    -- Excluir instalações e entregas
    DELETE FROM instalacoes_cadastradas WHERE pedido_id = p_pedido_id;
    DELETE FROM entregas WHERE pedido_id = p_pedido_id;
    
    RAISE LOG '[retroceder] Tudo excluído para pedido %', p_pedido_id;

  -- ========================================
  -- CASO 2: Retroceder para "em_producao"
  -- ========================================
  ELSIF p_etapa_destino = 'em_producao' THEN
    RAISE LOG '[retroceder] CASO 2: MANTER ordens de produção base, EXCLUIR qualidade e pintura';
    
    -- EXCLUIR linhas de qualidade e pintura
    DELETE FROM linhas_ordens 
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('qualidade', 'pintura');
    
    -- EXCLUIR ordens de qualidade e pintura
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    
    -- MANTER mas RESETAR ordens de soldagem, perfiladeira e separação
    UPDATE ordens_soldagem 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    -- Resetar linhas das ordens de produção base
    UPDATE linhas_ordens
    SET concluida = false, concluida_em = NULL, concluida_por = NULL
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao');
    
    -- Atualizar instalações para "em_producao"
    UPDATE instalacoes_cadastradas
    SET status = 'em_producao', 
        instalacao_concluida = false, 
        instalacao_concluida_em = NULL, 
        instalacao_concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
    
    -- Atualizar entregas para "em_producao"
    UPDATE entregas
    SET status = 'em_producao', 
        entrega_concluida = false,
        entrega_concluida_em = NULL, 
        entrega_concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
    
    RAISE LOG '[retroceder] Ordens produção base RESETADAS (soldagem/perfiladeira/separacao), qualidade e pintura EXCLUÍDAS';

  -- ========================================
  -- CASO 3: Retroceder para "aguardando_coleta"
  -- ========================================
  ELSIF p_etapa_destino = 'aguardando_coleta' THEN
    RAISE LOG '[retroceder] CASO 3: Mantendo ordens CONCLUÍDAS, atualizando entrega';
    
    -- NÃO alterar status das ordens (manter 'concluido')
    -- Apenas marcar como backlog e atualizar prioridade
    UPDATE ordens_soldagem 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_qualidade 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_pintura 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    -- Atualizar entrega para "pronta_fabrica" (Expedição Coleta)
    UPDATE entregas
    SET status = 'pronta_fabrica', 
        entrega_concluida = false,
        entrega_concluida_em = NULL, 
        entrega_concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
    
    RAISE LOG '[retroceder] Ordens mantidas como CONCLUÍDO, entrega → pronta_fabrica';

  -- ========================================
  -- CASO 4: Retroceder para "aguardando_instalacao"
  -- ========================================
  ELSIF p_etapa_destino = 'aguardando_instalacao' THEN
    RAISE LOG '[retroceder] CASO 4: Mantendo ordens CONCLUÍDAS, atualizando instalação';
    
    -- NÃO alterar status das ordens (manter 'concluido')
    -- Apenas marcar como backlog e atualizar prioridade
    UPDATE ordens_soldagem 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_qualidade 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_pintura 
    SET em_backlog = true, prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    -- Atualizar instalação para "pronta_fabrica" (Expedição Instalação)
    UPDATE instalacoes_cadastradas
    SET status = 'pronta_fabrica', 
        instalacao_concluida = false,
        instalacao_concluida_em = NULL, 
        instalacao_concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
    
    RAISE LOG '[retroceder] Ordens mantidas como CONCLUÍDO, instalação → pronta_fabrica';

  -- ========================================
  -- CASO 5: Outras etapas (inspecao_qualidade, aguardando_pintura)
  -- ========================================
  ELSE
    RAISE LOG '[retroceder] CASO 5: Resetando parcial para etapa %', p_etapa_destino;
    
    -- Resetar ordens de produção base
    UPDATE ordens_soldagem 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    -- Resetar linhas de ordens de produção base
    UPDATE linhas_ordens
    SET concluida = false, concluida_em = NULL, concluida_por = NULL
    WHERE pedido_id = p_pedido_id 
      AND tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao');
    
    -- Atualizar status de instalações/entregas conforme mapeamento
    UPDATE instalacoes_cadastradas
    SET status = CASE 
      WHEN p_etapa_destino IN ('inspecao_qualidade', 'aguardando_pintura') THEN 'em_producao'
      ELSE 'pendente_producao'
    END,
    instalacao_concluida = false,
    instalacao_concluida_em = NULL,
    instalacao_concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
    
    UPDATE entregas
    SET status = CASE 
      WHEN p_etapa_destino IN ('inspecao_qualidade', 'aguardando_pintura') THEN 'em_producao'
      ELSE 'pendente_producao'
    END,
    entrega_concluida = false,
    entrega_concluida_em = NULL,
    entrega_concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
  END IF;

  -- Fechar todas as etapas abertas do pedido
  UPDATE pedidos_etapas 
  SET data_saida = NOW() 
  WHERE pedido_id = p_pedido_id 
  AND data_saida IS NULL;

  -- Criar nova etapa com checkboxes padrão para a etapa de destino
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
  VALUES (
    p_pedido_id,
    p_etapa_destino,
    CASE p_etapa_destino
      WHEN 'aberto' THEN '[{"id": "check_producao_ok", "label": "Pedido está pronto para produção", "checked": false, "required": true}]'::jsonb
      WHEN 'em_producao' THEN '[{"id": "check_ordens_concluidas", "label": "Todas as ordens de produção foram concluídas", "checked": false, "required": true}]'::jsonb
      ELSE '[]'::jsonb
    END
  );

  -- Atualizar o pedido para etapa de destino
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino,
    status = CASE 
      WHEN p_etapa_destino = 'aberto' THEN 'pendente'
      ELSE 'em_andamento'
    END,
    prioridade_etapa = v_max_prioridade + 1000,
    em_backlog = true,
    updated_at = NOW()
  WHERE id = p_pedido_id;

  RAISE LOG '[retroceder] Pedido % retrocedido para etapa % com sucesso', p_pedido_id, p_etapa_destino;
END;
$function$;