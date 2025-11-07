-- =========================================================================
-- SOLUÇÃO COMPLETA: Resetar ordens ao retroceder e evitar duplicações
-- =========================================================================

-- 1. ATUALIZAR função retroceder_pedido_para_etapa para resetar TUDO
CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid, 
  p_etapa_destino text, 
  p_motivo_backlog text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_etapa_atual text;
  v_max_prioridade integer;
BEGIN
  -- Obter etapa atual
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  -- Obter maior prioridade da etapa destino
  SELECT COALESCE(MAX(prioridade_etapa), 0) INTO v_max_prioridade
  FROM pedidos_producao
  WHERE etapa_atual = p_etapa_destino;

  -- RESETAR TODAS AS ORDENS DE SOLDAGEM
  UPDATE ordens_soldagem 
  SET 
    status = 'pendente',
    data_inicio = NULL,
    data_conclusao = NULL,
    responsavel_id = NULL,
    em_backlog = true,
    prioridade = v_max_prioridade + 1000
  WHERE pedido_id = p_pedido_id;
  
  -- RESETAR TODAS AS ORDENS DE PERFILADEIRA
  UPDATE ordens_perfiladeira 
  SET 
    status = 'pendente',
    data_inicio = NULL,
    data_conclusao = NULL,
    responsavel_id = NULL,
    em_backlog = true,
    prioridade = v_max_prioridade + 1000
  WHERE pedido_id = p_pedido_id;
  
  -- RESETAR TODAS AS ORDENS DE SEPARAÇÃO
  UPDATE ordens_separacao 
  SET 
    status = 'pendente',
    data_inicio = NULL,
    data_conclusao = NULL,
    responsavel_id = NULL,
    em_backlog = true,
    prioridade = v_max_prioridade + 1000
  WHERE pedido_id = p_pedido_id;
  
  -- RESETAR TODAS AS ORDENS DE QUALIDADE
  UPDATE ordens_qualidade 
  SET 
    status = 'pendente',
    data_inicio = NULL,
    data_conclusao = NULL,
    responsavel_id = NULL,
    em_backlog = true,
    prioridade = v_max_prioridade + 1000
  WHERE pedido_id = p_pedido_id;
  
  -- RESETAR TODAS AS ORDENS DE PINTURA
  UPDATE ordens_pintura 
  SET 
    status = 'pendente',
    data_inicio = NULL,
    data_conclusao = NULL,
    responsavel_id = NULL,
    em_backlog = true,
    prioridade = v_max_prioridade + 1000
  WHERE pedido_id = p_pedido_id;
  
  -- RESETAR TODAS AS LINHAS DE ORDENS
  UPDATE linhas_ordens
  SET 
    concluida = false,
    concluida_em = NULL,
    concluida_por = NULL
  WHERE pedido_id = p_pedido_id;
  
  -- RESETAR INSTALAÇÕES
  UPDATE instalacoes_cadastradas
  SET 
    instalacao_concluida = false,
    instalacao_concluida_em = NULL,
    instalacao_concluida_por = NULL,
    status = CASE 
      WHEN p_etapa_destino IN ('aberto', 'em_producao', 'inspecao_qualidade', 'aguardando_pintura') 
        THEN 'pendente_producao'
      ELSE 'pronta_fabrica'
    END
  WHERE pedido_id = p_pedido_id;
  
  -- RESETAR ENTREGAS
  UPDATE entregas
  SET 
    entrega_concluida = false,
    entrega_concluida_em = NULL,
    entrega_concluida_por = NULL,
    status = CASE 
      WHEN p_etapa_destino = 'aberto' THEN 'pendente_producao'
      WHEN p_etapa_destino = 'em_producao' THEN 'em_producao'
      WHEN p_etapa_destino = 'inspecao_qualidade' THEN 'em_qualidade'
      WHEN p_etapa_destino = 'aguardando_pintura' THEN 'aguardando_pintura'
      WHEN p_etapa_destino = 'aguardando_coleta' THEN 'pronta_fabrica'
      ELSE 'pendente_producao'
    END
  WHERE pedido_id = p_pedido_id;

  -- Fechar etapa atual
  UPDATE pedidos_etapas
  SET data_saida = NOW()
  WHERE pedido_id = p_pedido_id
  AND data_saida IS NULL;

  -- Criar nova etapa com checkbox de backlog
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
  SELECT 
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
    NOW();

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

  RAISE LOG '[retroceder_pedido] Pedido % retrocedido de % para % - Todas ordens, linhas, instalações e entregas resetadas', 
    p_pedido_id, v_etapa_atual, p_etapa_destino;
END;
$$;

-- 2. ATUALIZAR função criar_ordens_producao_automaticas para evitar duplicações
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(
  p_pedido_id uuid,
  p_pedido_numero text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem_solda_id uuid;
  v_ordem_perfil_id uuid;
  v_ordem_separacao_id uuid;
  v_tem_soldagem boolean := false;
  v_tem_perfiladeira boolean := false;
  v_tem_separacao boolean := false;
  v_linha RECORD;
BEGIN
  -- Verificar quais tipos de ordem são necessárias
  FOR v_linha IN 
    SELECT DISTINCT
      CASE 
        WHEN LOWER(e.categoria) = 'componente' THEN true
        ELSE false
      END as precisa_soldagem,
      CASE 
        WHEN LOWER(e.categoria) = 'perfil' THEN true
        ELSE false
      END as precisa_perfiladeira,
      CASE 
        WHEN LOWER(e.categoria) IN ('acessorio', 'adicional', 'ferragem') THEN true
        ELSE false
      END as precisa_separacao
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
  LOOP
    IF v_linha.precisa_soldagem THEN v_tem_soldagem := true; END IF;
    IF v_linha.precisa_perfiladeira THEN v_tem_perfiladeira := true; END IF;
    IF v_linha.precisa_separacao THEN v_tem_separacao := true; END IF;
  END LOOP;

  -- ORDEM DE SOLDAGEM - Verificar se já existe antes de criar
  IF v_tem_soldagem THEN
    SELECT id INTO v_ordem_solda_id 
    FROM ordens_soldagem 
    WHERE pedido_id = p_pedido_id 
    LIMIT 1;
    
    IF v_ordem_solda_id IS NULL THEN
      INSERT INTO ordens_soldagem (
        pedido_id,
        numero_ordem,
        status,
        prioridade
      ) VALUES (
        p_pedido_id,
        gerar_numero_ordem('soldagem'),
        'pendente',
        0
      ) RETURNING id INTO v_ordem_solda_id;
      
      RAISE LOG '[criar_ordens] Ordem de soldagem criada: %', v_ordem_solda_id;
    ELSE
      RAISE LOG '[criar_ordens] Ordem de soldagem já existe: %', v_ordem_solda_id;
    END IF;

    -- Criar linhas para soldagem (componentes)
    INSERT INTO linhas_ordens (
      ordem_id,
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      produto_venda_id,
      largura,
      altura
    )
    SELECT 
      v_ordem_solda_id,
      pl.pedido_id,
      'soldagem',
      COALESCE(pl.nome_produto, pl.descricao_produto, e.nome_produto, 'Item'),
      COALESCE(pl.quantidade, 1),
      COALESCE(pl.tamanho, pl.largura::text || ' x ' || pl.altura::text),
      false,
      pl.produto_venda_id,
      pl.largura,
      pl.altura
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
      AND LOWER(e.categoria) = 'componente'
      AND NOT EXISTS (
        SELECT 1 FROM linhas_ordens 
        WHERE ordem_id = v_ordem_solda_id 
          AND pedido_id = p_pedido_id
          AND tipo_ordem = 'soldagem'
      );
  END IF;

  -- ORDEM DE PERFILADEIRA - Verificar se já existe antes de criar
  IF v_tem_perfiladeira THEN
    SELECT id INTO v_ordem_perfil_id 
    FROM ordens_perfiladeira 
    WHERE pedido_id = p_pedido_id 
    LIMIT 1;
    
    IF v_ordem_perfil_id IS NULL THEN
      INSERT INTO ordens_perfiladeira (
        pedido_id,
        numero_ordem,
        status,
        prioridade
      ) VALUES (
        p_pedido_id,
        gerar_numero_ordem('perfiladeira'),
        'pendente',
        0
      ) RETURNING id INTO v_ordem_perfil_id;
      
      RAISE LOG '[criar_ordens] Ordem de perfiladeira criada: %', v_ordem_perfil_id;
    ELSE
      RAISE LOG '[criar_ordens] Ordem de perfiladeira já existe: %', v_ordem_perfil_id;
    END IF;

    -- Criar linhas para perfiladeira
    INSERT INTO linhas_ordens (
      ordem_id,
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      produto_venda_id,
      largura,
      altura
    )
    SELECT 
      v_ordem_perfil_id,
      pl.pedido_id,
      'perfiladeira',
      COALESCE(e.nome_produto, 'Perfil'),
      COALESCE(pl.quantidade, 1),
      COALESCE(pl.tamanho, 'N/A'),
      false,
      pl.produto_venda_id,
      pl.largura,
      pl.altura
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
      AND LOWER(e.categoria) = 'perfil'
      AND NOT EXISTS (
        SELECT 1 FROM linhas_ordens 
        WHERE ordem_id = v_ordem_perfil_id 
          AND pedido_id = p_pedido_id
          AND tipo_ordem = 'perfiladeira'
      );
  END IF;

  -- ORDEM DE SEPARAÇÃO - Verificar se já existe antes de criar
  IF v_tem_separacao THEN
    SELECT id INTO v_ordem_separacao_id 
    FROM ordens_separacao 
    WHERE pedido_id = p_pedido_id 
    LIMIT 1;
    
    IF v_ordem_separacao_id IS NULL THEN
      INSERT INTO ordens_separacao (
        pedido_id,
        numero_ordem,
        status,
        prioridade
      ) VALUES (
        p_pedido_id,
        gerar_numero_ordem('separacao'),
        'pendente',
        0
      ) RETURNING id INTO v_ordem_separacao_id;
      
      RAISE LOG '[criar_ordens] Ordem de separação criada: %', v_ordem_separacao_id;
    ELSE
      RAISE LOG '[criar_ordens] Ordem de separação já existe: %', v_ordem_separacao_id;
    END IF;

    -- Criar linhas para separação
    INSERT INTO linhas_ordens (
      ordem_id,
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      produto_venda_id
    )
    SELECT 
      v_ordem_separacao_id,
      pl.pedido_id,
      'separacao',
      COALESCE(e.nome_produto, 'Item'),
      COALESCE(pl.quantidade, 1),
      COALESCE(pl.tamanho, 'N/A'),
      false,
      pl.produto_venda_id
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
      AND LOWER(e.categoria) IN ('acessorio', 'adicional', 'ferragem')
      AND NOT EXISTS (
        SELECT 1 FROM linhas_ordens 
        WHERE ordem_id = v_ordem_separacao_id 
          AND pedido_id = p_pedido_id
          AND tipo_ordem = 'separacao'
      );
  END IF;

  RAISE LOG '[criar_ordens] Finalizado para pedido: %', p_pedido_id;
END;
$$;

-- 3. SCRIPT DE LIMPEZA ONE-TIME para corrigir pedidos existentes
DO $$
DECLARE
  v_pedido RECORD;
  v_duplicates RECORD;
BEGIN
  RAISE NOTICE '=== INICIANDO LIMPEZA DE ORDENS DUPLICADAS ===';
  
  -- Identificar e remover ordens duplicadas de soldagem (manter apenas a mais antiga)
  FOR v_duplicates IN
    SELECT pedido_id, COUNT(*) as total
    FROM ordens_soldagem
    GROUP BY pedido_id
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Removendo % ordens duplicadas de soldagem do pedido %', v_duplicates.total - 1, v_duplicates.pedido_id;
    
    DELETE FROM linhas_ordens
    WHERE ordem_id IN (
      SELECT id FROM ordens_soldagem
      WHERE pedido_id = v_duplicates.pedido_id
      ORDER BY created_at DESC
      LIMIT (v_duplicates.total - 1)
    );
    
    DELETE FROM ordens_soldagem
    WHERE id IN (
      SELECT id FROM ordens_soldagem
      WHERE pedido_id = v_duplicates.pedido_id
      ORDER BY created_at DESC
      LIMIT (v_duplicates.total - 1)
    );
  END LOOP;

  -- Identificar e remover ordens duplicadas de perfiladeira
  FOR v_duplicates IN
    SELECT pedido_id, COUNT(*) as total
    FROM ordens_perfiladeira
    GROUP BY pedido_id
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Removendo % ordens duplicadas de perfiladeira do pedido %', v_duplicates.total - 1, v_duplicates.pedido_id;
    
    DELETE FROM linhas_ordens
    WHERE ordem_id IN (
      SELECT id FROM ordens_perfiladeira
      WHERE pedido_id = v_duplicates.pedido_id
      ORDER BY created_at DESC
      LIMIT (v_duplicates.total - 1)
    );
    
    DELETE FROM ordens_perfiladeira
    WHERE id IN (
      SELECT id FROM ordens_perfiladeira
      WHERE pedido_id = v_duplicates.pedido_id
      ORDER BY created_at DESC
      LIMIT (v_duplicates.total - 1)
    );
  END LOOP;

  -- Identificar e remover ordens duplicadas de separação
  FOR v_duplicates IN
    SELECT pedido_id, COUNT(*) as total
    FROM ordens_separacao
    GROUP BY pedido_id
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Removendo % ordens duplicadas de separação do pedido %', v_duplicates.total - 1, v_duplicates.pedido_id;
    
    DELETE FROM linhas_ordens
    WHERE ordem_id IN (
      SELECT id FROM ordens_separacao
      WHERE pedido_id = v_duplicates.pedido_id
      ORDER BY created_at DESC
      LIMIT (v_duplicates.total - 1)
    );
    
    DELETE FROM ordens_separacao
    WHERE id IN (
      SELECT id FROM ordens_separacao
      WHERE pedido_id = v_duplicates.pedido_id
      ORDER BY created_at DESC
      LIMIT (v_duplicates.total - 1)
    );
  END LOOP;

  -- Resetar status de ordens de pedidos atualmente em backlog
  FOR v_pedido IN
    SELECT id FROM pedidos_producao WHERE em_backlog = true
  LOOP
    RAISE NOTICE 'Resetando ordens do pedido em backlog: %', v_pedido.id;
    
    UPDATE ordens_soldagem 
    SET status = 'pendente', data_inicio = NULL, data_conclusao = NULL, responsavel_id = NULL
    WHERE pedido_id = v_pedido.id AND status = 'concluido';
    
    UPDATE ordens_perfiladeira 
    SET status = 'pendente', data_inicio = NULL, data_conclusao = NULL, responsavel_id = NULL
    WHERE pedido_id = v_pedido.id AND status = 'concluido';
    
    UPDATE ordens_separacao 
    SET status = 'pendente', data_inicio = NULL, data_conclusao = NULL, responsavel_id = NULL
    WHERE pedido_id = v_pedido.id AND status = 'concluido';
    
    UPDATE ordens_qualidade 
    SET status = 'pendente', data_inicio = NULL, data_conclusao = NULL, responsavel_id = NULL
    WHERE pedido_id = v_pedido.id AND status = 'concluido';
    
    UPDATE ordens_pintura 
    SET status = 'pendente', data_inicio = NULL, data_conclusao = NULL, responsavel_id = NULL
    WHERE pedido_id = v_pedido.id AND status = 'concluido';
    
    UPDATE linhas_ordens
    SET concluida = false, concluida_em = NULL, concluida_por = NULL
    WHERE pedido_id = v_pedido.id AND concluida = true;
    
    UPDATE instalacoes_cadastradas
    SET instalacao_concluida = false, instalacao_concluida_em = NULL, instalacao_concluida_por = NULL
    WHERE pedido_id = v_pedido.id AND instalacao_concluida = true;
    
    UPDATE entregas
    SET entrega_concluida = false, entrega_concluida_em = NULL, entrega_concluida_por = NULL
    WHERE pedido_id = v_pedido.id AND entrega_concluida = true;
  END LOOP;

  RAISE NOTICE '=== LIMPEZA CONCLUÍDA ===';
END $$;