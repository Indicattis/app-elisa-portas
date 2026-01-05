-- Atualizar a função criar_ordens_producao_automaticas para incluir ordens de terceirização
CREATE OR REPLACE FUNCTION criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_linha RECORD;
  v_produto RECORD;
  v_tem_soldagem BOOLEAN := false;
  v_tem_perfiladeira BOOLEAN := false;
  v_tem_separacao BOOLEAN := false;
  v_tem_porta_social BOOLEAN := false;
  v_ordem_solda_id uuid;
  v_ordem_perfil_id uuid;
  v_ordem_separacao_id uuid;
  v_ordem_porta_social_id uuid;
  v_numero_ordem_solda text;
  v_numero_ordem_perfil text;
  v_numero_ordem_separacao text;
  v_numero_ordem_porta_social text;
  v_numero_ordem_terceirizacao text;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
  v_setor text;
  v_venda_id uuid;
BEGIN
  RAISE LOG '[criar_ordens_producao_automaticas] Iniciando para pedido: %', p_pedido_id;

  -- Buscar status de backlog, prioridade e venda_id do pedido
  SELECT em_backlog, prioridade_etapa, venda_id 
  INTO v_pedido_em_backlog, v_pedido_prioridade, v_venda_id
  FROM pedidos_producao 
  WHERE id = p_pedido_id;
  
  RAISE LOG '[criar_ordens_producao_automaticas] Pedido backlog: %, prioridade: %, venda_id: %', 
    v_pedido_em_backlog, v_pedido_prioridade, v_venda_id;

  -- Verificar que tipos de ordens são necessários (baseado em pedido_linhas)
  FOR v_linha IN
    SELECT DISTINCT 
      COALESCE(
        e.setor_responsavel_producao::text,
        CASE pl.categoria_linha
          WHEN 'solda' THEN 'soldagem'
          WHEN 'perfiladeira' THEN 'perfiladeira'
          WHEN 'separacao' THEN 'separacao'
          ELSE NULL
        END
      ) as setor
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
  LOOP
    IF v_linha.setor = 'soldagem' THEN
      v_tem_soldagem := true;
    ELSIF v_linha.setor = 'perfiladeira' THEN
      v_tem_perfiladeira := true;
    ELSIF v_linha.setor = 'separacao' THEN
      v_tem_separacao := true;
    END IF;
  END LOOP;

  -- Verificar se a venda do pedido contém porta_social
  SELECT EXISTS (
    SELECT 1 
    FROM produtos_vendas pv
    JOIN pedidos_producao pp ON pv.venda_id = pp.venda_id
    WHERE pp.id = p_pedido_id 
    AND pv.tipo_produto = 'porta_social'
  ) INTO v_tem_porta_social;

  -- Criar ordem de SOLDAGEM se necessário
  IF v_tem_soldagem THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_soldagem WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('soldagem') INTO v_numero_ordem_solda;
      INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_solda, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_solda_id;
    ELSE
      SELECT id INTO v_ordem_solda_id FROM ordens_soldagem WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar ordem de PERFILADEIRA se necessário
  IF v_tem_perfiladeira THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('perfiladeira') INTO v_numero_ordem_perfil;
      INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_perfil, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_perfil_id;
    ELSE
      SELECT id INTO v_ordem_perfil_id FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar ordem de SEPARAÇÃO se necessário
  IF v_tem_separacao THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_separacao WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('separacao') INTO v_numero_ordem_separacao;
      INSERT INTO ordens_separacao (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_separacao, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_separacao_id;
    ELSE
      SELECT id INTO v_ordem_separacao_id FROM ordens_separacao WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar ordem de PORTA SOCIAL se necessário
  IF v_tem_porta_social THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_porta_social WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('porta_social') INTO v_numero_ordem_porta_social;
      INSERT INTO ordens_porta_social (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_porta_social, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_porta_social_id;
    ELSE
      SELECT id INTO v_ordem_porta_social_id FROM ordens_porta_social WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar ordens de TERCEIRIZAÇÃO para cada produto terceirizado da venda
  IF v_venda_id IS NOT NULL THEN
    FOR v_produto IN
      SELECT pv.id, pv.descricao, pv.quantidade, pv.tipo_produto
      FROM produtos_vendas pv
      WHERE pv.venda_id = v_venda_id
      AND pv.tipo_fabricacao = 'terceirizado'
    LOOP
      -- Verificar se já existe ordem para este produto
      IF NOT EXISTS(SELECT 1 FROM ordens_terceirizacao WHERE pedido_id = p_pedido_id AND produto_venda_id = v_produto.id) THEN
        SELECT gerar_numero_ordem('terceirizacao') INTO v_numero_ordem_terceirizacao;
        INSERT INTO ordens_terceirizacao (
          pedido_id, 
          produto_venda_id, 
          numero_ordem, 
          descricao_produto, 
          quantidade,
          status, 
          em_backlog, 
          prioridade
        )
        VALUES (
          p_pedido_id, 
          v_produto.id, 
          v_numero_ordem_terceirizacao, 
          COALESCE(v_produto.descricao, v_produto.tipo_produto),
          COALESCE(v_produto.quantidade, 1),
          'pendente', 
          COALESCE(v_pedido_em_backlog, false), 
          COALESCE(v_pedido_prioridade, 0)
        );
        RAISE LOG '[criar_ordens_producao_automaticas] Ordem terceirização criada para produto: %', v_produto.id;
      END IF;
    END LOOP;
  END IF;

  RAISE LOG '[criar_ordens_producao_automaticas] Concluído para pedido: %', p_pedido_id;
END;
$$;