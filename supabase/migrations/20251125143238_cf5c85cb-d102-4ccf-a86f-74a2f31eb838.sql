-- Atualizar função para considerar categoria_linha quando estoque_id é nulo
CREATE OR REPLACE FUNCTION criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  v_setor text;
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
  -- Agora considera TANTO estoque.setor_responsavel_producao QUANTO categoria_linha
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
    IF v_linha.setor = 'soldagem' OR v_linha.setor = 'solda' THEN
      v_tem_soldagem := true;
      RAISE LOG '[criar_ordens] Detectado setor soldagem';
    ELSIF v_linha.setor = 'perfiladeira' THEN
      v_tem_perfiladeira := true;
      RAISE LOG '[criar_ordens] Detectado setor perfiladeira';
    ELSIF v_linha.setor = 'separacao' THEN
      v_tem_separacao := true;
      RAISE LOG '[criar_ordens] Detectado setor separacao';
    END IF;
  END LOOP;

  RAISE LOG '[criar_ordens] Soldagem: %, Perfiladeira: %, Separacao: %', 
    v_tem_soldagem, v_tem_perfiladeira, v_tem_separacao;

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

  -- Criar linhas das ordens (agora usando LEFT JOIN)
  FOR v_linha IN
    SELECT 
      pl.*,
      COALESCE(e.nome_produto, pl.nome_produto) as nome_produto_final,
      COALESCE(
        e.setor_responsavel_producao::text,
        CASE pl.categoria_linha
          WHEN 'solda' THEN 'soldagem'
          WHEN 'perfiladeira' THEN 'perfiladeira'
          WHEN 'separacao' THEN 'separacao'
          ELSE NULL
        END
      ) as setor_final,
      pv.tamanho,
      pv.largura,
      pv.altura,
      pv.tipo_pintura,
      cc.nome as cor_nome
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    LEFT JOIN produtos_vendas pv ON pl.produto_venda_id = pv.id
    LEFT JOIN catalogo_cores cc ON pv.cor_id = cc.id
    WHERE pl.pedido_id = p_pedido_id
  LOOP
    v_setor := v_linha.setor_final;
    
    RAISE LOG '[criar_ordens] Processando linha: %, setor: %', v_linha.nome_produto_final, v_setor;
    
    -- Inserir na linhas_ordens com a ordem correspondente
    IF v_setor = 'soldagem' OR v_setor = 'solda' THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        produto_venda_id,
        item,
        quantidade,
        tipo_ordem,
        tamanho,
        largura,
        altura,
        tipo_pintura,
        cor_nome
      )
      VALUES (
        p_pedido_id,
        v_ordem_solda_id,
        v_linha.produto_venda_id,
        COALESCE(v_linha.nome_produto_final, 'Item'),
        v_linha.quantidade,
        'solda',
        v_linha.tamanho,
        v_linha.largura,
        v_linha.altura,
        v_linha.tipo_pintura,
        v_linha.cor_nome
      );
      RAISE LOG '[criar_ordens] Linha soldagem criada para: %', v_linha.nome_produto_final;
      
    ELSIF v_setor = 'perfiladeira' THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        produto_venda_id,
        item,
        quantidade,
        tipo_ordem,
        tamanho,
        largura,
        altura,
        tipo_pintura,
        cor_nome
      )
      VALUES (
        p_pedido_id,
        v_ordem_perfil_id,
        v_linha.produto_venda_id,
        COALESCE(v_linha.nome_produto_final, 'Item'),
        v_linha.quantidade,
        'perfiladeira',
        v_linha.tamanho,
        v_linha.largura,
        v_linha.altura,
        v_linha.tipo_pintura,
        v_linha.cor_nome
      );
      RAISE LOG '[criar_ordens] Linha perfiladeira criada para: %', v_linha.nome_produto_final;
      
    ELSIF v_setor = 'separacao' THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        produto_venda_id,
        item,
        quantidade,
        tipo_ordem,
        tamanho,
        largura,
        altura,
        tipo_pintura,
        cor_nome
      )
      VALUES (
        p_pedido_id,
        v_ordem_separacao_id,
        v_linha.produto_venda_id,
        COALESCE(v_linha.nome_produto_final, 'Item'),
        v_linha.quantidade,
        'separacao',
        v_linha.tamanho,
        v_linha.largura,
        v_linha.altura,
        v_linha.tipo_pintura,
        v_linha.cor_nome
      );
      RAISE LOG '[criar_ordens] Linha separacao criada para: %', v_linha.nome_produto_final;
    END IF;
  END LOOP;

  RAISE LOG '[criar_ordens_producao_automaticas] Concluído para pedido: %', p_pedido_id;
END;
$$;