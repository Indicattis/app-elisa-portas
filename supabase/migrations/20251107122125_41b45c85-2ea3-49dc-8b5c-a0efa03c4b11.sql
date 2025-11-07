-- Fix backlog conditional logic based on destination stage
-- This migration replaces the retroceder_pedido_para_etapa function with conditional logic

CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid, 
  p_etapa_destino text, 
  p_motivo_backlog text
)
RETURNS void AS $$
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
    RAISE LOG '[retroceder] CASO 2: Resetando ordens para PENDENTE (não excluir)';
    
    -- Resetar TODAS as ordens para pendente
    UPDATE ordens_soldagem 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_qualidade 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_pintura 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    -- Resetar todas as linhas
    UPDATE linhas_ordens
    SET concluida = false, concluida_em = NULL, concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
    
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
    
    RAISE LOG '[retroceder] Ordens resetadas para PENDENTE, instalações/entregas em produção';

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
    
    -- Resetar ordens de produção
    UPDATE ordens_soldagem 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;
    
    -- Resetar linhas de ordens de produção
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
      WHEN p_etapa_destino = 'inspecao_qualidade' THEN 'em_qualidade'
      WHEN p_etapa_destino = 'aguardando_pintura' THEN 'aguardando_pintura'
      ELSE 'pendente_producao'
    END,
    entrega_concluida = false,
    entrega_concluida_em = NULL,
    entrega_concluida_por = NULL
    WHERE pedido_id = p_pedido_id;
  END IF;

  -- Fechar etapa atual
  UPDATE pedidos_etapas 
  SET data_saida = NOW()
  WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;

  -- Criar nova etapa com checkbox de backlog
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
  VALUES (
    p_pedido_id,
    p_etapa_destino::text,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'check_backlog_resolvido',
        'label', 'Problema resolvido - pronto para avançar',
        'checked', false,
        'required', true
      )
    ),
    NOW()
  );

  -- Atualizar pedido
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino::text,
    em_backlog = true,
    motivo_backlog = p_motivo_backlog,
    etapa_origem_backlog = v_etapa_atual,
    prioridade_etapa = v_max_prioridade + 1000,
    updated_at = NOW()
  WHERE id = p_pedido_id;

  RAISE LOG '[retroceder] Pedido % retrocedido de % para % com sucesso', p_pedido_id, v_etapa_atual, p_etapa_destino;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;