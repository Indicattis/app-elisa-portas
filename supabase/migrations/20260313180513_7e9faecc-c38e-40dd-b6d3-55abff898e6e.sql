-- Fix: Remove restrictive e.categoria = 'componente' filter from criar_ordem_pintura
-- requer_pintura = true is sufficient to determine painting items
CREATE OR REPLACE FUNCTION public.criar_ordem_pintura(p_pedido_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  SELECT venda_id INTO v_venda_id
  FROM pedidos_producao
  WHERE id = p_pedido_id;
  
  IF NOT EXISTS (
    SELECT 1 FROM produtos_vendas 
    WHERE venda_id = v_venda_id 
    AND (valor_pintura > 0 OR tipo_produto = 'pintura_epoxi')
  ) THEN
    RAISE LOG '[criar_ordem_pintura] Venda % nao tem pintura contratada, abortando', v_venda_id;
    RETURN;
  END IF;
  
  IF EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
    RAISE LOG '[criar_ordem_pintura] Ordem de pintura ja existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;

  SELECT em_backlog, prioridade_etapa INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  SELECT 'PINT-' || LPAD((COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 6) AS INTEGER)), 0) + 1)::text, 5, '0')
  INTO v_numero_ordem
  FROM ordens_pintura;

  INSERT INTO ordens_pintura (pedido_id, numero_ordem, status, em_backlog, prioridade)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente', v_pedido_em_backlog, v_pedido_prioridade)
  RETURNING id INTO v_ordem_id;

  RAISE LOG '[criar_ordem_pintura] Ordem criada: % com id: %', v_numero_ordem, v_ordem_id;

  FOR v_linha IN
    SELECT 
      lo.id as linha_id,
      lo.estoque_id,
      lo.quantidade,
      lo.produto_venda_id,
      lo.indice_porta,
      e.nome_produto,
      e.requer_pintura
    FROM linhas_ordens lo
    JOIN estoque e ON e.id = lo.estoque_id
    WHERE lo.pedido_id = p_pedido_id
    AND lo.tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')
    AND e.requer_pintura = true
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id, ordem_id, tipo_ordem, estoque_id, quantidade, concluida, item, produto_venda_id, indice_porta
    ) VALUES (
      p_pedido_id, v_ordem_id, 'pintura', v_linha.estoque_id, v_linha.quantidade, false, v_linha.nome_produto, v_linha.produto_venda_id, v_linha.indice_porta
    );
    v_linhas_count := v_linhas_count + 1;
    RAISE LOG '[criar_ordem_pintura] Linha produção adicionada: % (requer_pintura: %)', v_linha.nome_produto, v_linha.requer_pintura;
  END LOOP;

  FOR v_linha IN
    SELECT 
      pl.estoque_id, pl.quantidade, pl.produto_venda_id, pl.indice_porta, e.nome_produto
    FROM pedido_linhas pl
    JOIN estoque e ON e.id = pl.estoque_id
    WHERE pl.pedido_id = p_pedido_id
    AND pl.categoria_linha = 'porta_social'
    AND e.requer_pintura = true
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id, ordem_id, tipo_ordem, estoque_id, quantidade, concluida, item, produto_venda_id, indice_porta
    ) VALUES (
      p_pedido_id, v_ordem_id, 'pintura', v_linha.estoque_id, v_linha.quantidade, false, v_linha.nome_produto, v_linha.produto_venda_id, v_linha.indice_porta
    );
    v_linhas_count := v_linhas_count + 1;
    RAISE LOG '[criar_ordem_pintura] Linha porta social adicionada: %', v_linha.nome_produto;
  END LOOP;

  RAISE LOG '[criar_ordem_pintura] Total de linhas criadas: %', v_linhas_count;

  IF v_linhas_count = 0 THEN
    DELETE FROM ordens_pintura WHERE id = v_ordem_id;
    RAISE LOG '[criar_ordem_pintura] Ordem deletada por nao ter linhas';
  ELSE
    UPDATE ordens_pintura SET metragem_quadrada = (
      SELECT COALESCE(SUM(pv.largura * pv.altura), 0)
      FROM produtos_vendas pv
      WHERE pv.venda_id = v_venda_id
        AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
        AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
    ) WHERE id = v_ordem_id;
    RAISE LOG '[criar_ordem_pintura] Metragem quadrada calculada para ordem %', v_ordem_id;
  END IF;
END;
$function$;