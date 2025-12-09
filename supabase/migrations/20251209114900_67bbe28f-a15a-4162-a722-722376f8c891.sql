-- Dropar ambas as versões da função para recriar corretamente
DROP FUNCTION IF EXISTS public.retroceder_pedido_para_etapa(uuid, text, text);
DROP FUNCTION IF EXISTS public.retroceder_pedido_para_etapa(uuid, text);

-- Recriar a função com a correção para deletar pontuacao_colaboradores primeiro
CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid,
  p_etapa_destino text,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_etapa_atual TEXT;
  v_tem_pintura BOOLEAN;
BEGIN
  -- Buscar etapa atual e se tem pintura
  SELECT etapa_atual, tem_pintura 
  INTO v_etapa_atual, v_tem_pintura
  FROM pedidos_producao 
  WHERE id = p_pedido_id;
  
  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;
  
  -- Registrar movimentação
  INSERT INTO pedidos_movimentacoes (
    pedido_id,
    etapa_origem,
    etapa_destino,
    realizado_por,
    observacoes
  ) VALUES (
    p_pedido_id,
    v_etapa_atual,
    p_etapa_destino,
    auth.uid(),
    COALESCE(p_motivo, 'Retrocesso de etapa')
  );
  
  -- Se voltando para 'aberto', limpar tudo
  IF p_etapa_destino = 'aberto' THEN
    -- IMPORTANTE: Deletar pontuações ANTES das linhas de ordens
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = p_pedido_id);
    
    -- Deletar linhas de ordens
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    
    -- Deletar todas as ordens
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_instalacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
    -- Deletar instalações cadastradas
    DELETE FROM instalacoes_cadastradas WHERE pedido_id = p_pedido_id;
    
    -- Fechar etapas abertas
    UPDATE pedidos_etapas 
    SET data_saida = NOW() 
    WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;
    
    -- Criar nova etapa aberto
    INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
    VALUES (
      p_pedido_id,
      'aberto',
      '[{"id": "check_producao_ok", "label": "Pedido está pronto para produção", "checked": false, "required": true}]'::jsonb
    );
    
    -- Atualizar pedido
    UPDATE pedidos_producao
    SET 
      etapa_atual = 'aberto',
      status = 'pendente',
      em_backlog = true,
      prioridade_etapa = 0,
      updated_at = NOW()
    WHERE id = p_pedido_id;
    
  -- Se voltando para 'em_producao'
  ELSIF p_etapa_destino = 'em_producao' THEN
    -- IMPORTANTE: Deletar pontuações de qualidade e pintura ANTES das linhas
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (
      SELECT id FROM linhas_ordens 
      WHERE pedido_id = p_pedido_id 
      AND tipo_ordem IN ('qualidade', 'pintura')
    );
    
    -- Deletar linhas de qualidade e pintura
    DELETE FROM linhas_ordens 
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('qualidade', 'pintura');
    
    -- Deletar ordens de qualidade e pintura
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_instalacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
    -- Resetar ordens de produção
    UPDATE ordens_soldagem SET status = 'pendente', responsavel_id = NULL WHERE pedido_id = p_pedido_id;
    UPDATE ordens_perfiladeira SET status = 'pendente', responsavel_id = NULL WHERE pedido_id = p_pedido_id;
    UPDATE ordens_separacao SET status = 'pendente', responsavel_id = NULL WHERE pedido_id = p_pedido_id;
    
    -- Resetar linhas de produção
    UPDATE linhas_ordens 
    SET concluida = false, concluida_em = NULL, concluida_por = NULL 
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao');
    
    -- Fechar etapa atual e criar nova
    UPDATE pedidos_etapas 
    SET data_saida = NOW() 
    WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;
    
    INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
    VALUES (
      p_pedido_id,
      'em_producao',
      '[{"id": "check_soldagem_ok", "label": "Soldagem concluída", "checked": false, "required": true},
        {"id": "check_perfiladeira_ok", "label": "Perfiladeira concluída", "checked": false, "required": true},
        {"id": "check_separacao_ok", "label": "Separação concluída", "checked": false, "required": true}]'::jsonb
    );
    
    UPDATE pedidos_producao
    SET 
      etapa_atual = 'em_producao',
      status = 'em_andamento',
      em_backlog = true,
      updated_at = NOW()
    WHERE id = p_pedido_id;
    
  -- Se voltando para 'inspecao_qualidade'
  ELSIF p_etapa_destino = 'inspecao_qualidade' THEN
    -- IMPORTANTE: Deletar pontuações de pintura ANTES das linhas
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (
      SELECT id FROM linhas_ordens 
      WHERE pedido_id = p_pedido_id 
      AND tipo_ordem = 'pintura'
    );
    
    -- Deletar ordens de pintura e posteriores
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_instalacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
    -- Resetar ordem de qualidade
    UPDATE ordens_qualidade SET status = 'pendente', responsavel_id = NULL WHERE pedido_id = p_pedido_id;
    UPDATE linhas_ordens 
    SET concluida = false, concluida_em = NULL, concluida_por = NULL 
    WHERE pedido_id = p_pedido_id AND tipo_ordem = 'qualidade';
    
    -- Fechar etapa atual e criar nova
    UPDATE pedidos_etapas 
    SET data_saida = NOW() 
    WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;
    
    INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
    VALUES (
      p_pedido_id,
      'inspecao_qualidade',
      '[{"id": "check_qualidade_ok", "label": "Inspeção de qualidade aprovada", "checked": false, "required": true}]'::jsonb
    );
    
    UPDATE pedidos_producao
    SET 
      etapa_atual = 'inspecao_qualidade',
      status = 'em_andamento',
      em_backlog = true,
      updated_at = NOW()
    WHERE id = p_pedido_id;
    
  -- Se voltando para 'aguardando_pintura'
  ELSIF p_etapa_destino = 'aguardando_pintura' THEN
    -- Deletar ordens posteriores
    DELETE FROM ordens_instalacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
    -- Resetar ordem de pintura
    UPDATE ordens_pintura SET status = 'pendente', responsavel_id = NULL WHERE pedido_id = p_pedido_id;
    UPDATE linhas_ordens 
    SET concluida = false, concluida_em = NULL, concluida_por = NULL 
    WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    
    -- Fechar etapa atual e criar nova
    UPDATE pedidos_etapas 
    SET data_saida = NOW() 
    WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;
    
    INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
    VALUES (
      p_pedido_id,
      'aguardando_pintura',
      '[{"id": "check_pintura_ok", "label": "Pintura concluída", "checked": false, "required": true}]'::jsonb
    );
    
    UPDATE pedidos_producao
    SET 
      etapa_atual = 'aguardando_pintura',
      status = 'em_andamento',
      em_backlog = true,
      updated_at = NOW()
    WHERE id = p_pedido_id;
  END IF;
  
END;
$function$;