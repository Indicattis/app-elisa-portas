-- ============================================================
-- PARTE 1: Corrigir função para incluir indice_porta nos INSERTs
-- ============================================================

CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ordem_solda_id UUID;
  v_ordem_perfiladeira_id UUID;
  v_ordem_separacao_id UUID;
  v_numero_ordem_solda TEXT;
  v_numero_ordem_perfiladeira TEXT;
  v_numero_ordem_separacao TEXT;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
  v_linhas_solda INTEGER := 0;
  v_linhas_perfiladeira INTEGER := 0;
  v_linhas_separacao INTEGER := 0;
BEGIN
  RAISE LOG '[criar_ordens_producao_automaticas] Iniciando para pedido: %', p_pedido_id;
  
  SELECT em_backlog, prioridade_etapa 
  INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao 
  WHERE id = p_pedido_id;
  
  -- ORDEM DE SOLDAGEM
  SELECT COUNT(*) INTO v_linhas_solda
  FROM pedido_linhas pl
  WHERE pl.pedido_id = p_pedido_id AND pl.categoria_linha = 'solda';
  
  IF v_linhas_solda > 0 THEN
    SELECT id INTO v_ordem_solda_id FROM ordens_soldagem WHERE pedido_id = p_pedido_id LIMIT 1;
    
    IF v_ordem_solda_id IS NULL THEN
      v_numero_ordem_solda := gerar_numero_ordem('soldagem');
      INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_solda, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_solda_id;
    END IF;
    
    INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id, indice_porta)
    SELECT v_ordem_solda_id, pl.pedido_id, 'soldagem', COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
      COALESCE(pl.quantidade, 1), pl.tamanho, false, pl.produto_venda_id, pl.largura, pl.altura, pl.id, pl.estoque_id, pl.indice_porta
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id AND pl.categoria_linha = 'solda'
      AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'soldagem');
  END IF;
  
  -- ORDEM DE PERFILADEIRA
  SELECT COUNT(*) INTO v_linhas_perfiladeira
  FROM pedido_linhas pl
  WHERE pl.pedido_id = p_pedido_id AND pl.categoria_linha = 'perfiladeira';
  
  IF v_linhas_perfiladeira > 0 THEN
    SELECT id INTO v_ordem_perfiladeira_id FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id LIMIT 1;
    
    IF v_ordem_perfiladeira_id IS NULL THEN
      v_numero_ordem_perfiladeira := gerar_numero_ordem('perfiladeira');
      INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_perfiladeira, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_perfiladeira_id;
    END IF;
    
    INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id, indice_porta)
    SELECT v_ordem_perfiladeira_id, pl.pedido_id, 'perfiladeira', COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
      COALESCE(pl.quantidade, 1), pl.tamanho, false, pl.produto_venda_id, pl.largura, pl.altura, pl.id, pl.estoque_id, pl.indice_porta
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id AND pl.categoria_linha = 'perfiladeira'
      AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'perfiladeira');
  END IF;
  
  -- ORDEM DE SEPARAÇÃO
  SELECT COUNT(*) INTO v_linhas_separacao
  FROM pedido_linhas pl
  WHERE pl.pedido_id = p_pedido_id AND pl.categoria_linha = 'separacao';
  
  IF v_linhas_separacao > 0 THEN
    SELECT id INTO v_ordem_separacao_id FROM ordens_separacao WHERE pedido_id = p_pedido_id LIMIT 1;
    
    IF v_ordem_separacao_id IS NULL THEN
      v_numero_ordem_separacao := gerar_numero_ordem('separacao');
      INSERT INTO ordens_separacao (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_separacao, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_separacao_id;
    END IF;
    
    INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id, indice_porta)
    SELECT v_ordem_separacao_id, pl.pedido_id, 'separacao', COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
      COALESCE(pl.quantidade, 1), pl.tamanho, false, pl.produto_venda_id, pl.largura, pl.altura, pl.id, pl.estoque_id, pl.indice_porta
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id AND pl.categoria_linha = 'separacao'
      AND NOT EXISTS (SELECT 1 FROM linhas_ordens lo WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'separacao');
  END IF;

  RAISE LOG '[criar_ordens_producao_automaticas] Finalizado para pedido: %', p_pedido_id;
END;
$function$;

-- ============================================================
-- PARTE 2: Backfill - Copiar indice_porta para linhas existentes
-- ============================================================

UPDATE linhas_ordens lo
SET indice_porta = pl.indice_porta
FROM pedido_linhas pl
WHERE lo.pedido_linha_id = pl.id
  AND lo.tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao')
  AND lo.indice_porta IS NULL
  AND pl.indice_porta IS NOT NULL;