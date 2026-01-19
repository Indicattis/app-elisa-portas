-- Atualizar função criar_ordem_qualidade para excluir linhas de separação
-- Apenas itens de solda e perfiladeira serão incluídos nas ordens de qualidade

CREATE OR REPLACE FUNCTION criar_ordem_qualidade(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ordem_id uuid;
  v_numero_ordem text;
  v_linha record;
BEGIN
  -- Verificar se já existe ordem de qualidade para este pedido
  SELECT id INTO v_ordem_id 
  FROM ordens_qualidade 
  WHERE pedido_id = p_pedido_id AND historico = false;
  
  IF v_ordem_id IS NOT NULL THEN
    RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- Gerar número da ordem
  SELECT gerar_numero_ordem('qualidade') INTO v_numero_ordem;
  
  -- Criar ordem de qualidade
  INSERT INTO ordens_qualidade (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade criada: % com número: %', v_ordem_id, v_numero_ordem;
  
  -- Criar linhas APENAS para itens de SOLDA e PERFILADEIRA (excluindo separação)
  FOR v_linha IN 
    SELECT * FROM pedido_linhas 
    WHERE pedido_id = p_pedido_id 
      AND categoria_linha IN ('solda', 'perfiladeira')
    ORDER BY ordem
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      estoque_id
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'qualidade',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
      false,
      v_linha.estoque_id
    );
    
    RAISE LOG '[criar_ordem_qualidade] Linha de qualidade criada para item: % (categoria: %)', v_linha.nome_produto, v_linha.categoria_linha;
  END LOOP;
  
END;
$$;