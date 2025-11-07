-- Sync backlog status when creating new orders
-- New orders should inherit backlog status from parent pedido

-- Update criar_ordem_qualidade to inherit backlog
CREATE OR REPLACE FUNCTION public.criar_ordem_qualidade(p_pedido_id uuid)
RETURNS void AS $$
DECLARE
  v_numero_ordem TEXT;
  v_ordem_id uuid;
  v_linha RECORD;
  v_linhas_count INTEGER;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
BEGIN
  RAISE LOG '[criar_ordem_qualidade] Iniciando para pedido: %', p_pedido_id;
  
  -- Verificar se já existe ordem de qualidade para este pedido
  IF EXISTS(SELECT 1 FROM ordens_qualidade WHERE pedido_id = p_pedido_id) THEN
    RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- Verificar se há linhas no pedido
  SELECT COUNT(*) INTO v_linhas_count FROM pedido_linhas WHERE pedido_id = p_pedido_id;
  
  IF v_linhas_count = 0 THEN
    RAISE LOG '[criar_ordem_qualidade] Nenhuma linha encontrada para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- Buscar status de backlog e prioridade do pedido
  SELECT em_backlog, prioridade_etapa 
  INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao 
  WHERE id = p_pedido_id;
  
  RAISE LOG '[criar_ordem_qualidade] Encontradas % linhas, Backlog: %, Prioridade: %', 
    v_linhas_count, v_pedido_em_backlog, v_pedido_prioridade;
  
  -- Gerar número da ordem
  SELECT gerar_numero_ordem('qualidade') INTO v_numero_ordem;
  
  -- Criar ordem de qualidade herdando backlog do pedido
  INSERT INTO ordens_qualidade (
    pedido_id, 
    numero_ordem, 
    status,
    em_backlog,
    prioridade
  )
  VALUES (
    p_pedido_id, 
    v_numero_ordem, 
    'pendente',
    COALESCE(v_pedido_em_backlog, false),
    COALESCE(v_pedido_prioridade, 0)
  )
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_qualidade] Ordem criada: % (backlog: %)', v_ordem_id, v_pedido_em_backlog;
  
  -- Criar linhas da ordem
  FOR v_linha IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id ORDER BY ordem
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'qualidade',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
      false
    );
  END LOOP;
  
  RAISE LOG '[criar_ordem_qualidade] Finalizado para pedido: %', p_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update criar_ordem_pintura to inherit backlog
CREATE OR REPLACE FUNCTION public.criar_ordem_pintura(p_pedido_id uuid)
RETURNS void AS $$
DECLARE
  v_numero_ordem text;
  v_ordem_id uuid;
  v_linha record;
  v_linhas_count integer := 0;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
BEGIN
  RAISE LOG '[criar_ordem_pintura] Iniciando para pedido: %', p_pedido_id;
  
  -- Verificar se já existe ordem de pintura para este pedido
  IF EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
    RAISE LOG '[criar_ordem_pintura] Ordem de pintura já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- Buscar status de backlog e prioridade do pedido
  SELECT em_backlog, prioridade_etapa 
  INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao 
  WHERE id = p_pedido_id;
  
  -- Gerar número da ordem
  v_numero_ordem := 'PINT-' || LPAD(nextval('seq_ordem_pintura')::text, 5, '0');
  
  -- Criar ordem de pintura herdando backlog do pedido
  INSERT INTO ordens_pintura (
    pedido_id, 
    numero_ordem, 
    status,
    em_backlog,
    prioridade
  )
  VALUES (
    p_pedido_id, 
    v_numero_ordem, 
    'pendente',
    COALESCE(v_pedido_em_backlog, false),
    COALESCE(v_pedido_prioridade, 0)
  )
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_pintura] Ordem criada: % (backlog: %)', v_ordem_id, v_pedido_em_backlog;
  
  -- Criar linhas agrupadas por porta (produto_venda_id)
  FOR v_linha IN
    SELECT 
      pl.produto_venda_id,
      pl.largura,
      pl.altura,
      COALESCE(pl.nome_produto, pl.descricao_produto, 'Item') as item,
      COALESCE(pl.quantidade, 1) as quantidade,
      COALESCE(pl.tamanho, pl.largura::text || ' x ' || pl.altura::text) as medidas,
      e.nome_produto,
      pv.cor_id,
      pv.tipo_pintura,
      cc.nome as cor_nome
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    LEFT JOIN produtos_vendas pv ON pl.produto_venda_id = pv.id
    LEFT JOIN catalogo_cores cc ON pv.cor_id = cc.id
    WHERE pl.pedido_id = p_pedido_id
      AND LOWER(e.categoria) = 'componente'
    ORDER BY pl.produto_venda_id, pl.ordem
  LOOP
    INSERT INTO linhas_ordens (
      ordem_id,
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      produto_venda_id,
      cor_nome,
      tipo_pintura,
      largura,
      altura
    ) VALUES (
      v_ordem_id,
      p_pedido_id,
      'pintura',
      v_linha.item,
      v_linha.quantidade,
      v_linha.medidas,
      false,
      v_linha.produto_venda_id,
      v_linha.cor_nome,
      v_linha.tipo_pintura,
      v_linha.largura,
      v_linha.altura
    );
    
    v_linhas_count := v_linhas_count + 1;
  END LOOP;
  
  RAISE LOG '[criar_ordem_pintura] Finalizado: % linhas criadas', v_linhas_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update criar_ordens_producao_automaticas to inherit backlog
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void AS $$
DECLARE
  v_linha RECORD;
  v_tem_soldagem BOOLEAN := false;
  v_tem_perfiladeira BOOLEAN := false;
  v_tem_separacao BOOLEAN := false;
  v_ordem_solda_id uuid;
  v_ordem_perfil_id uuid;
  v_ordem_separacao_id uuid;
  v_numero_ordem_solda text;
  v_numero_ordem_perfil text;
  v_numero_ordem_separacao text;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
BEGIN
  RAISE LOG '[criar_ordens_producao_automaticas] Iniciando para pedido: %', p_pedido_id;

  -- Buscar status de backlog e prioridade do pedido
  SELECT em_backlog, prioridade_etapa 
  INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao 
  WHERE id = p_pedido_id;
  
  RAISE LOG '[criar_ordens_producao_automaticas] Pedido backlog: %, prioridade: %', 
    v_pedido_em_backlog, v_pedido_prioridade;

  -- Verificar que tipos de ordens são necessários
  FOR v_linha IN
    SELECT DISTINCT e.setor_responsavel_producao
    FROM pedido_linhas pl
    JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
      AND e.setor_responsavel_producao IS NOT NULL
  LOOP
    IF v_linha.setor_responsavel_producao = 'soldagem' THEN
      v_tem_soldagem := true;
    ELSIF v_linha.setor_responsavel_producao = 'perfiladeira' THEN
      v_tem_perfiladeira := true;
    ELSIF v_linha.setor_responsavel_producao = 'separacao' THEN
      v_tem_separacao := true;
    END IF;
  END LOOP;

  -- Criar ordem de SOLDAGEM se necessário
  IF v_tem_soldagem THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_soldagem WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('soldagem') INTO v_numero_ordem_solda;
      INSERT INTO ordens_soldagem (
        pedido_id, 
        numero_ordem, 
        status,
        em_backlog,
        prioridade
      )
      VALUES (
        p_pedido_id, 
        v_numero_ordem_solda, 
        'pendente',
        COALESCE(v_pedido_em_backlog, false),
        COALESCE(v_pedido_prioridade, 0)
      )
      RETURNING id INTO v_ordem_solda_id;
      
      RAISE LOG '[criar_ordens] Ordem soldagem criada: % (backlog: %)', v_ordem_solda_id, v_pedido_em_backlog;
    ELSE
      SELECT id INTO v_ordem_solda_id FROM ordens_soldagem WHERE pedido_id = p_pedido_id LIMIT 1;
      RAISE LOG '[criar_ordens] Ordem soldagem já existe: %', v_ordem_solda_id;
    END IF;
  END IF;

  -- Criar ordem de PERFILADEIRA se necessário
  IF v_tem_perfiladeira THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('perfiladeira') INTO v_numero_ordem_perfil;
      INSERT INTO ordens_perfiladeira (
        pedido_id, 
        numero_ordem, 
        status,
        em_backlog,
        prioridade
      )
      VALUES (
        p_pedido_id, 
        v_numero_ordem_perfil, 
        'pendente',
        COALESCE(v_pedido_em_backlog, false),
        COALESCE(v_pedido_prioridade, 0)
      )
      RETURNING id INTO v_ordem_perfil_id;
      
      RAISE LOG '[criar_ordens] Ordem perfiladeira criada: % (backlog: %)', v_ordem_perfil_id, v_pedido_em_backlog;
    ELSE
      SELECT id INTO v_ordem_perfil_id FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id LIMIT 1;
      RAISE LOG '[criar_ordens] Ordem perfiladeira já existe: %', v_ordem_perfil_id;
    END IF;
  END IF;

  -- Criar ordem de SEPARAÇÃO se necessário
  IF v_tem_separacao THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_separacao WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('separacao') INTO v_numero_ordem_separacao;
      INSERT INTO ordens_separacao (
        pedido_id, 
        numero_ordem, 
        status,
        em_backlog,
        prioridade
      )
      VALUES (
        p_pedido_id, 
        v_numero_ordem_separacao, 
        'pendente',
        COALESCE(v_pedido_em_backlog, false),
        COALESCE(v_pedido_prioridade, 0)
      )
      RETURNING id INTO v_ordem_separacao_id;
      
      RAISE LOG '[criar_ordens] Ordem separacao criada: % (backlog: %)', v_ordem_separacao_id, v_pedido_em_backlog;
    ELSE
      SELECT id INTO v_ordem_separacao_id FROM ordens_separacao WHERE pedido_id = p_pedido_id LIMIT 1;
      RAISE LOG '[criar_ordens] Ordem separacao já existe: %', v_ordem_separacao_id;
    END IF;
  END IF;

  -- Criar linhas das ordens
  FOR v_linha IN
    SELECT 
      pl.*,
      e.nome_produto,
      e.setor_responsavel_producao
    FROM pedido_linhas pl
    JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
      AND e.setor_responsavel_producao IN ('soldagem', 'perfiladeira', 'separacao')
    ORDER BY pl.ordem
  LOOP
    -- Inserir linha na ordem correspondente
    IF v_linha.setor_responsavel_producao = 'soldagem' AND v_ordem_solda_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id, ordem_id, tipo_ordem, item, quantidade, tamanho, concluida
      ) VALUES (
        p_pedido_id, v_ordem_solda_id, 'soldagem',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
        false
      );

    ELSIF v_linha.setor_responsavel_producao = 'perfiladeira' AND v_ordem_perfil_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id, ordem_id, tipo_ordem, item, quantidade, tamanho, concluida
      ) VALUES (
        p_pedido_id, v_ordem_perfil_id, 'perfiladeira',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
        false
      );

    ELSIF v_linha.setor_responsavel_producao = 'separacao' AND v_ordem_separacao_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id, ordem_id, tipo_ordem, item, quantidade, tamanho, concluida
      ) VALUES (
        p_pedido_id, v_ordem_separacao_id, 'separacao',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
        false
      );
    END IF;
  END LOOP;

  RAISE LOG '[criar_ordens_producao_automaticas] Finalizado para pedido: %', p_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;