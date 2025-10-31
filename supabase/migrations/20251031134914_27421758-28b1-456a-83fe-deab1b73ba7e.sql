-- Criar função SECURITY DEFINER para criar ordens de produção automaticamente
CREATE OR REPLACE FUNCTION criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero_solda TEXT;
  v_numero_perfil TEXT;
  v_numero_sep TEXT;
  v_linha RECORD;
BEGIN
  -- Gerar números de ordem
  SELECT gerar_numero_ordem('soldagem') INTO v_numero_solda;
  SELECT gerar_numero_ordem('perfiladeira') INTO v_numero_perfil;
  SELECT gerar_numero_ordem('separacao') INTO v_numero_sep;
  
  -- Criar ordem de soldagem
  INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_solda, 'pendente');
  
  -- Criar ordem de perfiladeira
  INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_perfil, 'pendente');
  
  -- Criar ordem de separação
  INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_sep, 'pendente');
  
  -- Criar linhas de cada ordem baseado nas linhas do pedido
  FOR v_linha IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id
  LOOP
    -- Linha de soldagem
    INSERT INTO linhas_ordens (
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho
    ) VALUES (
      p_pedido_id,
      'soldagem',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
    );
    
    -- Linha de perfiladeira
    INSERT INTO linhas_ordens (
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho
    ) VALUES (
      p_pedido_id,
      'perfiladeira',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
    );
    
    -- Linha de separação
    INSERT INTO linhas_ordens (
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho
    ) VALUES (
      p_pedido_id,
      'separacao',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
    );
  END LOOP;
END;
$$;