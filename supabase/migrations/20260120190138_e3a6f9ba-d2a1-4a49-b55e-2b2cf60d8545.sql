-- Atualizar a função criar_ordens_producao_automaticas(p_pedido_id uuid) para incluir numero_ordem
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido RECORD;
  v_ordem_perfiladeira_id uuid;
  v_ordem_separacao_id uuid;
  v_ordem_soldagem_id uuid;
  v_numero_ordem text;
  v_ano text;
  v_sequencia integer;
  pl RECORD;
  v_item_nome text;
BEGIN
  -- Buscar dados do pedido
  SELECT * INTO v_pedido FROM pedidos_producao WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_pedido_id;
  END IF;

  v_ano := TO_CHAR(NOW(), 'YYYY');

  -- Criar ou buscar ordem de perfiladeira
  SELECT id INTO v_ordem_perfiladeira_id 
  FROM ordens_perfiladeira 
  WHERE pedido_id = p_pedido_id 
  LIMIT 1;
  
  IF v_ordem_perfiladeira_id IS NULL THEN
    -- Gerar numero_ordem para perfiladeira
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
    FROM ordens_perfiladeira
    WHERE numero_ordem LIKE 'OPE-' || v_ano || '-%';
    
    v_numero_ordem := 'OPE-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
    
    INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status, created_at)
    VALUES (p_pedido_id, v_numero_ordem, 'pendente', now())
    RETURNING id INTO v_ordem_perfiladeira_id;
  END IF;

  -- Criar ou buscar ordem de separação
  SELECT id INTO v_ordem_separacao_id 
  FROM ordens_separacao 
  WHERE pedido_id = p_pedido_id 
  LIMIT 1;
  
  IF v_ordem_separacao_id IS NULL THEN
    -- Gerar numero_ordem para separação
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
    FROM ordens_separacao
    WHERE numero_ordem LIKE 'OSP-' || v_ano || '-%';
    
    v_numero_ordem := 'OSP-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
    
    INSERT INTO ordens_separacao (pedido_id, numero_ordem, status, created_at)
    VALUES (p_pedido_id, v_numero_ordem, 'pendente', now())
    RETURNING id INTO v_ordem_separacao_id;
  END IF;

  -- Criar ou buscar ordem de soldagem
  SELECT id INTO v_ordem_soldagem_id 
  FROM ordens_soldagem 
  WHERE pedido_id = p_pedido_id 
  LIMIT 1;
  
  IF v_ordem_soldagem_id IS NULL THEN
    -- Gerar numero_ordem para soldagem
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 10) AS INTEGER)), 0) + 1
    INTO v_sequencia
    FROM ordens_soldagem
    WHERE numero_ordem LIKE 'OSO-' || v_ano || '-%';
    
    v_numero_ordem := 'OSO-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
    
    INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status, created_at)
    VALUES (p_pedido_id, v_numero_ordem, 'pendente', now())
    RETURNING id INTO v_ordem_soldagem_id;
  END IF;

  -- Processar linhas do pedido e criar linhas nas ordens
  FOR pl IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id
  LOOP
    v_item_nome := COALESCE(pl.nome_produto, pl.descricao_produto, 'Item');
    
    -- Criar linha na ordem correspondente baseado na categoria_linha
    IF pl.categoria_linha = 'perfiladeira' AND v_ordem_perfiladeira_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE lo.pedido_linha_id = pl.id
      ) THEN
        INSERT INTO linhas_ordens (
          ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
          concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
        )
        VALUES (
          v_ordem_perfiladeira_id, p_pedido_id, 'perfiladeira', v_item_nome, 
          COALESCE(pl.quantidade, 1), pl.tamanho, false, pl.produto_venda_id, 
          pl.largura, pl.altura, pl.id, pl.estoque_id
        );
      END IF;
      
    ELSIF pl.categoria_linha = 'separacao' AND v_ordem_separacao_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE lo.pedido_linha_id = pl.id
      ) THEN
        INSERT INTO linhas_ordens (
          ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
          concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
        )
        VALUES (
          v_ordem_separacao_id, p_pedido_id, 'separacao', v_item_nome, 
          COALESCE(pl.quantidade, 1), pl.tamanho, false, pl.produto_venda_id, 
          pl.largura, pl.altura, pl.id, pl.estoque_id
        );
      END IF;
      
    ELSIF pl.categoria_linha = 'solda' AND v_ordem_soldagem_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE lo.pedido_linha_id = pl.id
      ) THEN
        INSERT INTO linhas_ordens (
          ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
          concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
        )
        VALUES (
          v_ordem_soldagem_id, p_pedido_id, 'soldagem', v_item_nome, 
          COALESCE(pl.quantidade, 1), pl.tamanho, false, pl.produto_venda_id, 
          pl.largura, pl.altura, pl.id, pl.estoque_id
        );
      END IF;
    END IF;
  END LOOP;
END;
$function$;