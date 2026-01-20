-- 1. Inserir linhas faltantes para PERFILADEIRA
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, 
  tamanho, concluida, produto_venda_id, largura, altura, 
  pedido_linha_id, estoque_id
)
SELECT 
  op.id as ordem_id,
  pl.pedido_id,
  'perfiladeira' as tipo_ordem,
  COALESCE(e.nome_produto, pl.nome_produto, 'Item') as item,
  COALESCE(pl.quantidade, 1) as quantidade,
  pl.tamanho,
  false as concluida,
  pl.produto_venda_id,
  pl.largura,
  pl.altura,
  pl.id as pedido_linha_id,
  pl.estoque_id
FROM ordens_perfiladeira op
JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
LEFT JOIN estoque e ON e.id = pl.estoque_id
WHERE pl.categoria_linha = 'perfiladeira'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id
  );

-- 2. Inserir linhas faltantes para SOLDAGEM
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, 
  tamanho, concluida, produto_venda_id, largura, altura, 
  pedido_linha_id, estoque_id
)
SELECT 
  os.id as ordem_id,
  pl.pedido_id,
  'soldagem' as tipo_ordem,
  COALESCE(e.nome_produto, pl.nome_produto, 'Item') as item,
  COALESCE(pl.quantidade, 1) as quantidade,
  pl.tamanho,
  false as concluida,
  pl.produto_venda_id,
  pl.largura,
  pl.altura,
  pl.id as pedido_linha_id,
  pl.estoque_id
FROM ordens_soldagem os
JOIN pedido_linhas pl ON pl.pedido_id = os.pedido_id
LEFT JOIN estoque e ON e.id = pl.estoque_id
WHERE pl.categoria_linha = 'solda'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id
  );

-- 3. Inserir linhas faltantes para SEPARACAO
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, 
  tamanho, concluida, produto_venda_id, largura, altura, 
  pedido_linha_id, estoque_id
)
SELECT 
  osep.id as ordem_id,
  pl.pedido_id,
  'separacao' as tipo_ordem,
  COALESCE(e.nome_produto, pl.nome_produto, 'Item') as item,
  COALESCE(pl.quantidade, 1) as quantidade,
  pl.tamanho,
  false as concluida,
  pl.produto_venda_id,
  pl.largura,
  pl.altura,
  pl.id as pedido_linha_id,
  pl.estoque_id
FROM ordens_separacao osep
JOIN pedido_linhas pl ON pl.pedido_id = osep.pedido_id
LEFT JOIN estoque e ON e.id = pl.estoque_id
WHERE pl.categoria_linha = 'separacao'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id
  );

-- 4. Corrigir a função para usar categoria_linha ao invés de categoria
CREATE OR REPLACE FUNCTION criar_ordens_producao_automaticas()
RETURNS TRIGGER AS $$
DECLARE
  v_pedido_id UUID;
  v_ordem_perfiladeira_id UUID;
  v_ordem_separacao_id UUID;
  v_ordem_soldagem_id UUID;
  v_numero_ordem TEXT;
  v_ano TEXT;
  v_sequencia INTEGER;
  pl RECORD;
BEGIN
  v_pedido_id := NEW.id;
  v_ano := TO_CHAR(NOW(), 'YYYY');

  -- Criar ordem de perfiladeira se houver linhas dessa categoria
  IF EXISTS (SELECT 1 FROM pedido_linhas WHERE pedido_id = v_pedido_id AND categoria_linha = 'perfiladeira') THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
    FROM ordens_perfiladeira
    WHERE numero_ordem LIKE 'OPE-' || v_ano || '-%';
    
    v_numero_ordem := 'OPE-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
    
    INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
    VALUES (v_pedido_id, v_numero_ordem, 'pendente')
    RETURNING id INTO v_ordem_perfiladeira_id;
  END IF;

  -- Criar ordem de separação se houver linhas dessa categoria
  IF EXISTS (SELECT 1 FROM pedido_linhas WHERE pedido_id = v_pedido_id AND categoria_linha = 'separacao') THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
    FROM ordens_separacao
    WHERE numero_ordem LIKE 'OSP-' || v_ano || '-%';
    
    v_numero_ordem := 'OSP-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
    
    INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
    VALUES (v_pedido_id, v_numero_ordem, 'pendente')
    RETURNING id INTO v_ordem_separacao_id;
  END IF;

  -- Criar ordem de soldagem se houver linhas dessa categoria
  IF EXISTS (SELECT 1 FROM pedido_linhas WHERE pedido_id = v_pedido_id AND categoria_linha = 'solda') THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
    FROM ordens_soldagem
    WHERE numero_ordem LIKE 'OSO-' || v_ano || '-%';
    
    v_numero_ordem := 'OSO-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
    
    INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status, qtd_portas_p, qtd_portas_g)
    VALUES (v_pedido_id, v_numero_ordem, 'pendente', 0, 0)
    RETURNING id INTO v_ordem_soldagem_id;
  END IF;

  -- Criar linhas_ordens para cada pedido_linha
  FOR pl IN SELECT * FROM pedido_linhas WHERE pedido_id = v_pedido_id LOOP
    IF pl.categoria_linha = 'perfiladeira' AND v_ordem_perfiladeira_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
        concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
      )
      SELECT 
        v_ordem_perfiladeira_id,
        v_pedido_id,
        'perfiladeira',
        COALESCE(e.nome_produto, pl.nome_produto, 'Item'),
        COALESCE(pl.quantidade, 1),
        pl.tamanho,
        false,
        pl.produto_venda_id,
        pl.largura,
        pl.altura,
        pl.id,
        pl.estoque_id
      FROM (SELECT pl.*) sub
      LEFT JOIN estoque e ON e.id = pl.estoque_id;
      
    ELSIF pl.categoria_linha = 'separacao' AND v_ordem_separacao_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
        concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
      )
      SELECT 
        v_ordem_separacao_id,
        v_pedido_id,
        'separacao',
        COALESCE(e.nome_produto, pl.nome_produto, 'Item'),
        COALESCE(pl.quantidade, 1),
        pl.tamanho,
        false,
        pl.produto_venda_id,
        pl.largura,
        pl.altura,
        pl.id,
        pl.estoque_id
      FROM (SELECT pl.*) sub
      LEFT JOIN estoque e ON e.id = pl.estoque_id;
      
    ELSIF pl.categoria_linha = 'solda' AND v_ordem_soldagem_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
        concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
      )
      SELECT 
        v_ordem_soldagem_id,
        v_pedido_id,
        'soldagem',
        COALESCE(e.nome_produto, pl.nome_produto, 'Item'),
        COALESCE(pl.quantidade, 1),
        pl.tamanho,
        false,
        pl.produto_venda_id,
        pl.largura,
        pl.altura,
        pl.id,
        pl.estoque_id
      FROM (SELECT pl.*) sub
      LEFT JOIN estoque e ON e.id = pl.estoque_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;