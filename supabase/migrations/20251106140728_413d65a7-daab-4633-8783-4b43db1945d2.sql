-- Atualizar função criar_ordens_producao_automaticas para definir prioridade inicial
CREATE OR REPLACE FUNCTION criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_numero_solda TEXT;
  v_numero_perfil TEXT;
  v_numero_sep TEXT;
  v_ordem_solda_id uuid;
  v_ordem_perfil_id uuid;
  v_ordem_sep_id uuid;
  v_linha RECORD;
  v_tem_soldagem BOOLEAN := FALSE;
  v_tem_perfiladeira BOOLEAN := FALSE;
  v_tem_separacao BOOLEAN := FALSE;
  v_prioridade_pedido INTEGER := 0;
BEGIN
  RAISE LOG '[criar_ordens_producao_automaticas] Iniciando para pedido: %', p_pedido_id;
  
  -- Obter prioridade do pedido
  SELECT prioridade_etapa INTO v_prioridade_pedido
  FROM pedidos_producao
  WHERE id = p_pedido_id;
  
  -- Verificar quais tipos de ordem existem baseado no setor_responsavel_producao
  SELECT 
    EXISTS(
      SELECT 1 FROM pedido_linhas pl
      LEFT JOIN estoque e ON pl.estoque_id = e.id
      WHERE pl.pedido_id = p_pedido_id 
      AND (LOWER(e.setor_responsavel_producao::text) = 'solda' OR e.setor_responsavel_producao IS NULL)
    ),
    EXISTS(
      SELECT 1 FROM pedido_linhas pl
      LEFT JOIN estoque e ON pl.estoque_id = e.id
      WHERE pl.pedido_id = p_pedido_id 
      AND LOWER(e.setor_responsavel_producao::text) = 'perfiladeira'
    ),
    EXISTS(
      SELECT 1 FROM pedido_linhas pl
      LEFT JOIN estoque e ON pl.estoque_id = e.id
      WHERE pl.pedido_id = p_pedido_id 
      AND LOWER(e.setor_responsavel_producao::text) = 'separacao'
    )
  INTO v_tem_soldagem, v_tem_perfiladeira, v_tem_separacao;
  
  RAISE LOG '[criar_ordens_producao_automaticas] Tem soldagem: %, perfiladeira: %, separacao: %', 
    v_tem_soldagem, v_tem_perfiladeira, v_tem_separacao;
  
  -- Criar ordem de soldagem apenas se houver linhas
  IF v_tem_soldagem THEN
    SELECT gerar_numero_ordem('soldagem') INTO v_numero_solda;
    INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status, prioridade)
    VALUES (p_pedido_id, v_numero_solda, 'pendente', v_prioridade_pedido)
    RETURNING id INTO v_ordem_solda_id;
    RAISE LOG '[criar_ordens_producao_automaticas] Ordem de soldagem criada: %', v_ordem_solda_id;
  END IF;
  
  -- Criar ordem de perfiladeira apenas se houver linhas
  IF v_tem_perfiladeira THEN
    SELECT gerar_numero_ordem('perfiladeira') INTO v_numero_perfil;
    INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status, prioridade)
    VALUES (p_pedido_id, v_numero_perfil, 'pendente', v_prioridade_pedido)
    RETURNING id INTO v_ordem_perfil_id;
    RAISE LOG '[criar_ordens_producao_automaticas] Ordem de perfiladeira criada: %', v_ordem_perfil_id;
  END IF;
  
  -- Criar ordem de separação apenas se houver linhas
  IF v_tem_separacao THEN
    SELECT gerar_numero_ordem('separacao') INTO v_numero_sep;
    INSERT INTO ordens_separacao (pedido_id, numero_ordem, status, prioridade)
    VALUES (p_pedido_id, v_numero_sep, 'pendente', v_prioridade_pedido)
    RETURNING id INTO v_ordem_sep_id;
    RAISE LOG '[criar_ordens_producao_automaticas] Ordem de separacao criada: %', v_ordem_sep_id;
  END IF;
  
  -- Criar linhas de cada ordem baseado no setor_responsavel_producao do estoque
  FOR v_linha IN 
    SELECT 
      pl.*,
      e.nome_produto as estoque_nome,
      LOWER(e.setor_responsavel_producao::text) as setor
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
  LOOP
    RAISE LOG '[criar_ordens_producao_automaticas] Processando linha: % - Setor: %', 
      COALESCE(v_linha.nome_produto, v_linha.estoque_nome), v_linha.setor;
    
    -- Linhas de soldagem (incluindo NULL que vai para soldagem por padrão)
    IF (v_linha.setor = 'solda' OR v_linha.setor IS NULL) AND v_ordem_solda_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        tipo_ordem,
        item,
        quantidade,
        tamanho
      ) VALUES (
        p_pedido_id,
        v_ordem_solda_id,
        'soldagem',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, v_linha.estoque_nome, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
      );
      RAISE LOG '[criar_ordens_producao_automaticas] Linha de soldagem criada para item: %', v_linha.nome_produto;
    END IF;
    
    -- Linhas de perfiladeira
    IF v_linha.setor = 'perfiladeira' AND v_ordem_perfil_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        tipo_ordem,
        item,
        quantidade,
        tamanho
      ) VALUES (
        p_pedido_id,
        v_ordem_perfil_id,
        'perfiladeira',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, v_linha.estoque_nome, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
      );
      RAISE LOG '[criar_ordens_producao_automaticas] Linha de perfiladeira criada para item: %', v_linha.nome_produto;
    END IF;
    
    -- Linhas de separação
    IF v_linha.setor = 'separacao' AND v_ordem_sep_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        tipo_ordem,
        item,
        quantidade,
        tamanho
      ) VALUES (
        p_pedido_id,
        v_ordem_sep_id,
        'separacao',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, v_linha.estoque_nome, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
      );
      RAISE LOG '[criar_ordens_producao_automaticas] Linha de separacao criada para item: %', v_linha.nome_produto;
    END IF;
  END LOOP;
  
  RAISE LOG '[criar_ordens_producao_automaticas] Finalizado para pedido: %', p_pedido_id;
END;
$$;