
-- Parte 1: Recriar função criar_ordem_qualidade com produto_venda_id e indice_porta
CREATE OR REPLACE FUNCTION public.criar_ordem_qualidade(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem_id uuid;
  v_numero_ordem text;
  v_linha record;
  v_linhas_elegiveis INTEGER;
BEGIN
  -- Verificar se já existe ordem de qualidade para este pedido
  SELECT id INTO v_ordem_id 
  FROM ordens_qualidade 
  WHERE pedido_id = p_pedido_id AND historico = false;
  
  IF v_ordem_id IS NOT NULL THEN
    RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- Contar itens elegíveis (solda/perfiladeira)
  SELECT COUNT(*) INTO v_linhas_elegiveis
  FROM pedido_linhas 
  WHERE pedido_id = p_pedido_id 
    AND categoria_linha IN ('solda', 'perfiladeira');
  
  IF v_linhas_elegiveis = 0 THEN
    RAISE LOG '[criar_ordem_qualidade] Nenhum item elegível (solda/perfiladeira) para pedido: %. Ordem NÃO será criada.', p_pedido_id;
    RETURN;
  END IF;
  
  -- Gerar número da ordem
  SELECT gerar_numero_ordem('qualidade') INTO v_numero_ordem;
  
  -- Criar ordem de qualidade
  INSERT INTO ordens_qualidade (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade criada: % com número: %', v_ordem_id, v_numero_ordem;
  
  -- Criar linhas com produto_venda_id e indice_porta
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
      estoque_id,
      produto_venda_id,
      indice_porta
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'qualidade',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
      false,
      v_linha.estoque_id,
      v_linha.produto_venda_id,
      v_linha.indice_porta
    );
  END LOOP;
  
END;
$$;

-- Parte 2: Corrigir dados existentes - preencher produto_venda_id e indice_porta nas linhas de qualidade
UPDATE linhas_ordens lo
SET produto_venda_id = pl.produto_venda_id,
    indice_porta = pl.indice_porta
FROM pedido_linhas pl
WHERE lo.tipo_ordem = 'qualidade'
  AND lo.produto_venda_id IS NULL
  AND lo.pedido_id = pl.pedido_id
  AND lo.estoque_id = pl.estoque_id;
