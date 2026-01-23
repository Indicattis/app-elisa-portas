-- Atualizar função criar_ordem_pintura para verificar se venda tem pintura contratada
CREATE OR REPLACE FUNCTION public.criar_ordem_pintura(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero_ordem text;
  v_ordem_id uuid;
  v_linha record;
  v_linhas_count integer := 0;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
  v_venda_id uuid;
BEGIN
  RAISE LOG '[criar_ordem_pintura] Iniciando para pedido: %', p_pedido_id;
  
  -- Buscar venda_id do pedido
  SELECT venda_id INTO v_venda_id
  FROM pedidos_producao
  WHERE id = p_pedido_id;
  
  -- VERIFICAÇÃO: Só criar ordem se venda tem pintura contratada
  IF NOT EXISTS (
    SELECT 1 FROM produtos_vendas 
    WHERE venda_id = v_venda_id 
    AND (valor_pintura > 0 OR tipo_produto = 'pintura_epoxi')
  ) THEN
    RAISE LOG '[criar_ordem_pintura] Venda % não tem pintura contratada, abortando', v_venda_id;
    RETURN;
  END IF;
  
  -- Verificar se já existe ordem de pintura para este pedido
  IF EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
    RAISE LOG '[criar_ordem_pintura] Ordem de pintura já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;

  -- Buscar informações de prioridade do pedido
  SELECT em_backlog, prioridade_etapa INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  -- Gerar número da ordem
  SELECT 'PINT-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 6) AS INTEGER)), 0) + 1)::text, 5, '0')
  INTO v_numero_ordem
  FROM ordens_pintura;

  -- Criar a ordem de pintura
  INSERT INTO ordens_pintura (pedido_id, numero_ordem, status, em_backlog, prioridade)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente', v_pedido_em_backlog, v_pedido_prioridade)
  RETURNING id INTO v_ordem_id;

  RAISE LOG '[criar_ordem_pintura] Ordem criada: % com id: %', v_numero_ordem, v_ordem_id;

  -- Inserir linhas para itens que requerem pintura (categoria = 'componente')
  FOR v_linha IN
    SELECT 
      lo.id as linha_id,
      lo.item_estoque_id,
      lo.quantidade,
      e.nome_produto,
      e.requer_pintura
    FROM linhas_ordens lo
    JOIN estoque e ON e.id = lo.item_estoque_id
    WHERE lo.pedido_id = p_pedido_id
    AND lo.tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')
    AND e.categoria = 'componente'
    AND e.requer_pintura = true
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      item_estoque_id,
      quantidade,
      concluida
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'pintura',
      v_linha.item_estoque_id,
      v_linha.quantidade,
      false
    );
    v_linhas_count := v_linhas_count + 1;
    RAISE LOG '[criar_ordem_pintura] Linha adicionada: % (requer_pintura: %)', v_linha.nome_produto, v_linha.requer_pintura;
  END LOOP;

  RAISE LOG '[criar_ordem_pintura] Total de linhas criadas: %', v_linhas_count;

  -- Se não houver linhas, deletar a ordem vazia
  IF v_linhas_count = 0 THEN
    DELETE FROM ordens_pintura WHERE id = v_ordem_id;
    RAISE LOG '[criar_ordem_pintura] Ordem deletada por não ter linhas';
  END IF;
END;
$$;

-- Limpar ordens de pintura criadas incorretamente (vendas sem pintura contratada)
-- Primeiro deletar as linhas
DELETE FROM linhas_ordens
WHERE tipo_ordem = 'pintura'
AND ordem_id IN (
  SELECT op.id
  FROM ordens_pintura op
  JOIN pedidos_producao pp ON pp.id = op.pedido_id
  WHERE NOT EXISTS (
    SELECT 1 FROM produtos_vendas pv 
    WHERE pv.venda_id = pp.venda_id 
    AND (pv.valor_pintura > 0 OR pv.tipo_produto = 'pintura_epoxi')
  )
);

-- Depois deletar as ordens de pintura inválidas
DELETE FROM ordens_pintura
WHERE id IN (
  SELECT op.id
  FROM ordens_pintura op
  JOIN pedidos_producao pp ON pp.id = op.pedido_id
  WHERE NOT EXISTS (
    SELECT 1 FROM produtos_vendas pv 
    WHERE pv.venda_id = pp.venda_id 
    AND (pv.valor_pintura > 0 OR pv.tipo_produto = 'pintura_epoxi')
  )
);