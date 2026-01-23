-- Atualizar função para criar ordens APENAS quando existirem linhas para o setor correspondente
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_numero text;
  v_ordem_soldagem_id uuid;
  v_ordem_perfiladeira_id uuid;
  v_ordem_separacao_id uuid;
  v_novo_numero_soldagem text;
  v_novo_numero_perfiladeira text;
  v_novo_numero_separacao text;
  v_ano text := to_char(CURRENT_DATE, 'YYYY');
  v_proximo_numero_soldagem int;
  v_proximo_numero_perfiladeira int;
  v_proximo_numero_separacao int;
  v_tem_linhas_soldagem boolean;
  v_tem_linhas_perfiladeira boolean;
  v_tem_linhas_separacao boolean;
BEGIN
  -- Buscar número do pedido
  SELECT numero_pedido INTO v_pedido_numero
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  IF v_pedido_numero IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_pedido_id;
  END IF;

  -- Verificar se existem linhas para cada setor
  SELECT EXISTS (
    SELECT 1 FROM pedido_linhas 
    WHERE pedido_id = p_pedido_id AND categoria_linha = 'solda'
  ) INTO v_tem_linhas_soldagem;

  SELECT EXISTS (
    SELECT 1 FROM pedido_linhas 
    WHERE pedido_id = p_pedido_id AND categoria_linha = 'perfiladeira'
  ) INTO v_tem_linhas_perfiladeira;

  SELECT EXISTS (
    SELECT 1 FROM pedido_linhas 
    WHERE pedido_id = p_pedido_id AND categoria_linha = 'separacao'
  ) INTO v_tem_linhas_separacao;

  -- ========== SOLDAGEM ==========
  IF v_tem_linhas_soldagem THEN
    -- Verificar se já existe ordem de soldagem para este pedido
    SELECT id INTO v_ordem_soldagem_id
    FROM ordens_soldagem
    WHERE pedido_id = p_pedido_id
    LIMIT 1;

    IF v_ordem_soldagem_id IS NULL THEN
      -- Gerar próximo número
      SELECT COALESCE(MAX(
        CASE 
          WHEN numero_ordem ~ ('^OSO-' || v_ano || '-[0-9]+$')
          THEN CAST(SUBSTRING(numero_ordem FROM '[0-9]+$') AS INTEGER)
          ELSE 0
        END
      ), 0) + 1 INTO v_proximo_numero_soldagem
      FROM ordens_soldagem;

      v_novo_numero_soldagem := 'OSO-' || v_ano || '-' || LPAD(v_proximo_numero_soldagem::text, 4, '0');

      INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status)
      VALUES (p_pedido_id, v_novo_numero_soldagem, 'pendente')
      RETURNING id INTO v_ordem_soldagem_id;
    END IF;

    -- Inserir linhas de soldagem (se não existirem)
    INSERT INTO linhas_ordens (
      ordem_id, pedido_id, tipo_ordem, item, quantidade, 
      tamanho, concluida, produto_venda_id, largura, altura, 
      pedido_linha_id, estoque_id
    )
    SELECT 
      v_ordem_soldagem_id,
      pl.pedido_id,
      'soldagem',
      COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
      COALESCE(pl.quantidade, 1),
      pl.tamanho,
      false,
      pl.produto_venda_id,
      pl.largura,
      pl.altura,
      pl.id,
      pl.estoque_id
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id 
      AND pl.categoria_linha = 'solda'
      AND NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'soldagem'
      );
  END IF;

  -- ========== PERFILADEIRA ==========
  IF v_tem_linhas_perfiladeira THEN
    -- Verificar se já existe ordem de perfiladeira para este pedido
    SELECT id INTO v_ordem_perfiladeira_id
    FROM ordens_perfiladeira
    WHERE pedido_id = p_pedido_id
    LIMIT 1;

    IF v_ordem_perfiladeira_id IS NULL THEN
      -- Gerar próximo número
      SELECT COALESCE(MAX(
        CASE 
          WHEN numero_ordem ~ ('^OPE-' || v_ano || '-[0-9]+$')
          THEN CAST(SUBSTRING(numero_ordem FROM '[0-9]+$') AS INTEGER)
          ELSE 0
        END
      ), 0) + 1 INTO v_proximo_numero_perfiladeira
      FROM ordens_perfiladeira;

      v_novo_numero_perfiladeira := 'OPE-' || v_ano || '-' || LPAD(v_proximo_numero_perfiladeira::text, 4, '0');

      INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
      VALUES (p_pedido_id, v_novo_numero_perfiladeira, 'pendente')
      RETURNING id INTO v_ordem_perfiladeira_id;
    END IF;

    -- Inserir linhas de perfiladeira (se não existirem)
    INSERT INTO linhas_ordens (
      ordem_id, pedido_id, tipo_ordem, item, quantidade, 
      tamanho, concluida, produto_venda_id, largura, altura, 
      pedido_linha_id, estoque_id
    )
    SELECT 
      v_ordem_perfiladeira_id,
      pl.pedido_id,
      'perfiladeira',
      COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
      COALESCE(pl.quantidade, 1),
      pl.tamanho,
      false,
      pl.produto_venda_id,
      pl.largura,
      pl.altura,
      pl.id,
      pl.estoque_id
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id 
      AND pl.categoria_linha = 'perfiladeira'
      AND NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'perfiladeira'
      );
  END IF;

  -- ========== SEPARAÇÃO ==========
  IF v_tem_linhas_separacao THEN
    -- Verificar se já existe ordem de separação para este pedido
    SELECT id INTO v_ordem_separacao_id
    FROM ordens_separacao
    WHERE pedido_id = p_pedido_id
    LIMIT 1;

    IF v_ordem_separacao_id IS NULL THEN
      -- Gerar próximo número
      SELECT COALESCE(MAX(
        CASE 
          WHEN numero_ordem ~ ('^OSE-' || v_ano || '-[0-9]+$')
          THEN CAST(SUBSTRING(numero_ordem FROM '[0-9]+$') AS INTEGER)
          ELSE 0
        END
      ), 0) + 1 INTO v_proximo_numero_separacao
      FROM ordens_separacao;

      v_novo_numero_separacao := 'OSE-' || v_ano || '-' || LPAD(v_proximo_numero_separacao::text, 4, '0');

      INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
      VALUES (p_pedido_id, v_novo_numero_separacao, 'pendente')
      RETURNING id INTO v_ordem_separacao_id;
    END IF;

    -- Inserir linhas de separação (se não existirem)
    INSERT INTO linhas_ordens (
      ordem_id, pedido_id, tipo_ordem, item, quantidade, 
      tamanho, concluida, produto_venda_id, largura, altura, 
      pedido_linha_id, estoque_id
    )
    SELECT 
      v_ordem_separacao_id,
      pl.pedido_id,
      'separacao',
      COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
      COALESCE(pl.quantidade, 1),
      pl.tamanho,
      false,
      pl.produto_venda_id,
      pl.largura,
      pl.altura,
      pl.id,
      pl.estoque_id
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id 
      AND pl.categoria_linha = 'separacao'
      AND NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'separacao'
      );
  END IF;

END;
$$;

-- Limpar ordens vazias existentes (ordens sem linhas)
DELETE FROM ordens_perfiladeira op
WHERE NOT EXISTS (
  SELECT 1 FROM linhas_ordens lo 
  WHERE lo.ordem_id = op.id AND lo.tipo_ordem = 'perfiladeira'
);

DELETE FROM ordens_soldagem os
WHERE NOT EXISTS (
  SELECT 1 FROM linhas_ordens lo 
  WHERE lo.ordem_id = os.id AND lo.tipo_ordem = 'soldagem'
);

DELETE FROM ordens_separacao osp
WHERE NOT EXISTS (
  SELECT 1 FROM linhas_ordens lo 
  WHERE lo.ordem_id = osp.id AND lo.tipo_ordem = 'separacao'
);