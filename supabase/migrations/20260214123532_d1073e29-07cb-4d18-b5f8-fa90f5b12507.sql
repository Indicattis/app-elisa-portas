
-- 1. Corrigir get_portas_por_etapa: pintura_m2 via produtos_vendas
CREATE OR REPLACE FUNCTION get_portas_por_etapa(p_data_inicio date, p_data_fim date)
RETURNS TABLE(
  metros_perfilados numeric,
  portas_soldadas bigint,
  pedidos_separados bigint,
  pintura_m2 numeric,
  carregamentos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(lo.quantidade * REPLACE(SPLIT_PART(lo.tamanho, 'x', 1), ',', '.')::numeric)
      FROM linhas_ordens lo
      JOIN ordens_perfiladeira op ON op.id = lo.ordem_id
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.tamanho IS NOT NULL
        AND lo.tamanho ~ '^\d'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS metros_perfilados,
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      WHERE os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS portas_soldadas,
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_separacao osep
      WHERE osep.status = 'concluido'
        AND osep.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS pedidos_separados,
    COALESCE((
      SELECT SUM(pv.largura * pv.altura)
      FROM ordens_pintura op
      JOIN pedidos_producao pp ON pp.id = op.pedido_id
      JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
        AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
        AND pv.largura IS NOT NULL
        AND pv.altura IS NOT NULL
      WHERE op.status = 'pronta'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS pintura_m2,
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos;
END;
$$;

-- 2. Corrigir get_desempenho_etapas: pintura_m2 por colaborador via produtos_vendas
CREATE OR REPLACE FUNCTION get_desempenho_etapas(p_data_inicio date, p_data_fim date)
RETURNS TABLE(
  user_id uuid,
  nome text,
  foto_perfil_url text,
  perfiladas_metros numeric,
  soldadas bigint,
  soldadas_p bigint,
  soldadas_g bigint,
  separadas bigint,
  pintura_m2 numeric,
  carregamentos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.user_id,
    au.nome,
    au.foto_perfil_url,
    COALESCE((
      SELECT SUM(lo.quantidade * REPLACE(SPLIT_PART(lo.tamanho, 'x', 1), ',', '.')::numeric)
      FROM linhas_ordens lo
      JOIN ordens_perfiladeira op ON op.id = lo.ordem_id
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.concluida_por = au.user_id
        AND lo.tamanho IS NOT NULL
        AND lo.tamanho ~ '^\d'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS perfiladas_metros,
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas,
    COALESCE((
      SELECT SUM(os.qtd_portas_p)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas_p,
    COALESCE((
      SELECT SUM(os.qtd_portas_g)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas_g,
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_separacao osep
      WHERE osep.responsavel_id = au.user_id
        AND osep.status = 'concluido'
        AND osep.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS separadas,
    COALESCE((
      SELECT SUM(pv.largura * pv.altura)
      FROM ordens_pintura op
      JOIN pedidos_producao pp ON pp.id = op.pedido_id
      JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
        AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
        AND pv.largura IS NOT NULL
        AND pv.altura IS NOT NULL
      WHERE op.responsavel_id = au.user_id
        AND op.status = 'pronta'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS pintura_m2,
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido_por = au.user_id
        AND i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true;
END;
$$;

-- 3. Corrigir criar_ordem_pintura: preencher metragem_quadrada
CREATE OR REPLACE FUNCTION criar_ordem_pintura(p_pedido_id uuid)
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
    AND e.categoria = 'componente'
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
    -- Preencher metragem_quadrada com base em produtos_vendas
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
$$;

-- 4. Backfill: atualizar ordens existentes com metragem_quadrada = 0
UPDATE ordens_pintura op SET metragem_quadrada = (
  SELECT COALESCE(SUM(pv.largura * pv.altura), 0)
  FROM pedidos_producao pp
  JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
  WHERE pp.id = op.pedido_id
    AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
    AND pv.largura IS NOT NULL AND pv.altura IS NOT NULL
) WHERE op.metragem_quadrada = 0 OR op.metragem_quadrada IS NULL;
