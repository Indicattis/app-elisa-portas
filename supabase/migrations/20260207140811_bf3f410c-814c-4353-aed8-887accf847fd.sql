
CREATE OR REPLACE FUNCTION public.retroceder_pedido_unificado(
  p_pedido_id UUID,
  p_etapa_destino TEXT,
  p_motivo TEXT,
  p_ordens_config JSONB DEFAULT '[]'::jsonb,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_etapa_atual TEXT;
  v_tem_pintura BOOLEAN;
  v_config JSONB;
  v_tipo TEXT;
  v_acao TEXT;
  v_justificativa TEXT;
  v_pintura_config JSONB;
  v_pintura_acao TEXT;
BEGIN
  -- Buscar etapa atual
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  -- CORREÇÃO: Verificar se pedido tem pintura contratada consultando produtos_vendas
  SELECT EXISTS(
    SELECT 1 FROM pedidos_producao p
    WHERE p.id = p_pedido_id
    AND EXISTS(
      SELECT 1 FROM produtos_vendas pv 
      WHERE pv.venda_id = p.venda_id 
      AND (pv.valor_pintura > 0 OR pv.tipo_produto = 'pintura_epoxi')
    )
  ) INTO v_tem_pintura;

  -- =============================================
  -- CASO 1: Retornar para ABERTO
  -- =============================================
  IF p_etapa_destino = 'aberto' THEN
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = p_pedido_id);
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    
    UPDATE pedidos_producao SET
      etapa_atual = 'aberto',
      em_backlog = FALSE,
      status = 'pendente',
      updated_at = now()
    WHERE id = p_pedido_id;

  -- =============================================
  -- CASO 2: Retornar para EM_PRODUCAO
  -- =============================================
  ELSIF p_etapa_destino = 'em_producao' THEN
    DELETE FROM linhas_ordens 
    WHERE pedido_id = p_pedido_id AND tipo_ordem IN ('qualidade', 'pintura');
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    
    FOR v_config IN SELECT * FROM jsonb_array_elements(p_ordens_config)
    LOOP
      v_tipo := v_config->>'tipo';
      v_acao := v_config->>'acao';
      v_justificativa := v_config->>'justificativa';
      
      IF v_acao = 'pausar' THEN
        IF v_tipo = 'soldagem' THEN
          UPDATE ordens_soldagem SET status = 'pausada', pausada = true,
            justificativa_pausa = COALESCE(v_justificativa, p_motivo)
          WHERE pedido_id = p_pedido_id;
        ELSIF v_tipo = 'perfiladeira' THEN
          UPDATE ordens_perfiladeira SET status = 'pausada', pausada = true,
            justificativa_pausa = COALESCE(v_justificativa, p_motivo)
          WHERE pedido_id = p_pedido_id;
        ELSIF v_tipo = 'separacao' THEN
          UPDATE ordens_separacao SET status = 'pausada', pausada = true,
            justificativa_pausa = COALESCE(v_justificativa, p_motivo)
          WHERE pedido_id = p_pedido_id;
        END IF;
        
      ELSIF v_acao = 'reativar' THEN
        IF v_tipo = 'soldagem' THEN
          UPDATE ordens_soldagem SET status = 'pendente', historico = false,
            em_backlog = true, data_conclusao = NULL, pausada = false
          WHERE pedido_id = p_pedido_id;
          UPDATE linhas_ordens SET concluida = false 
          WHERE pedido_id = p_pedido_id AND tipo_ordem = 'soldagem';
        ELSIF v_tipo = 'perfiladeira' THEN
          UPDATE ordens_perfiladeira SET status = 'pendente', historico = false,
            em_backlog = true, data_conclusao = NULL, pausada = false
          WHERE pedido_id = p_pedido_id;
          UPDATE linhas_ordens SET concluida = false 
          WHERE pedido_id = p_pedido_id AND tipo_ordem = 'perfiladeira';
        ELSIF v_tipo = 'separacao' THEN
          UPDATE ordens_separacao SET status = 'pendente', historico = false,
            em_backlog = true, data_conclusao = NULL, pausada = false
          WHERE pedido_id = p_pedido_id;
          UPDATE linhas_ordens SET concluida = false 
          WHERE pedido_id = p_pedido_id AND tipo_ordem = 'separacao';
        END IF;
      END IF;
    END LOOP;
    
    UPDATE pedidos_producao SET
      etapa_atual = 'em_producao',
      em_backlog = TRUE,
      updated_at = now()
    WHERE id = p_pedido_id;

  -- =============================================
  -- CASO 3: Retornar para AGUARDANDO_PINTURA
  -- =============================================
  ELSIF p_etapa_destino = 'aguardando_pintura' THEN
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    
    SELECT elem INTO v_pintura_config
    FROM jsonb_array_elements(p_ordens_config) elem
    WHERE elem->>'tipo' = 'pintura'
    LIMIT 1;
    
    v_pintura_acao := COALESCE(v_pintura_config->>'acao', 'resetar');
    
    IF v_pintura_acao = 'resetar' THEN
      IF NOT EXISTS (SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
        PERFORM criar_ordem_pintura(p_pedido_id);
      ELSE
        UPDATE ordens_pintura SET 
          status = 'pendente', 
          historico = false, 
          em_backlog = true,
          data_conclusao = NULL
        WHERE pedido_id = p_pedido_id;
        UPDATE linhas_ordens SET concluida = false 
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
      END IF;
    ELSIF v_pintura_acao = 'manter' THEN
      UPDATE ordens_pintura SET em_backlog = true
      WHERE pedido_id = p_pedido_id;
    END IF;
    
    UPDATE pedidos_producao SET
      etapa_atual = 'aguardando_pintura',
      em_backlog = TRUE,
      updated_at = now()
    WHERE id = p_pedido_id;
  
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Etapa destino inválida');
  END IF;

  -- Registrar movimentacao
  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (p_pedido_id, v_etapa_atual, p_etapa_destino, p_user_id, 'backlog', p_motivo);

  -- Fechar etapa atual e abrir nova (UPSERT para evitar violação de unique constraint)
  UPDATE pedidos_etapas SET data_saida = now()
  WHERE pedido_id = p_pedido_id AND data_saida IS NULL;
  
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (p_pedido_id, p_etapa_destino, now(), '[]'::jsonb)
  ON CONFLICT (pedido_id, etapa) DO UPDATE SET
    data_entrada = now(),
    data_saida = NULL,
    checkboxes = '[]'::jsonb;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
