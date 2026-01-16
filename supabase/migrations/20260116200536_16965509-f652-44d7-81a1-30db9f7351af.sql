-- Dropar funções antigas
DROP FUNCTION IF EXISTS public.get_portas_por_etapa_hoje();
DROP FUNCTION IF EXISTS public.get_desempenho_etapas_hoje();

-- Criar função corrigida para métricas por etapa com filtro de data
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa(data_inicio date, data_fim date)
RETURNS TABLE(
  metros_perfilados numeric,
  portas_soldadas integer,
  pedidos_separados integer,
  pintura_m2 numeric,
  carregamentos integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Perfiladas: soma de tamanho * quantidade de linhas de perfiladeira concluídas
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN lo.tamanho ~ '^[0-9]+([.,][0-9]+)?$' 
          THEN CAST(REPLACE(lo.tamanho, ',', '.') AS numeric) * lo.quantidade
          ELSE 0
        END
      )
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') 
            BETWEEN data_inicio AND data_fim
    ), 0)::numeric AS metros_perfilados,
    
    -- Soldadas: soma de porta_enrolar em pedidos com soldagem concluída
    COALESCE((
      SELECT SUM(pv.quantidade)::integer
      FROM ordens_soldagem os
      JOIN pedidos_producao pp ON pp.id = os.pedido_id
      JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id 
           AND pv.tipo_produto = 'porta_enrolar'
      WHERE os.status = 'concluido'
        AND DATE(os.data_conclusao AT TIME ZONE 'America/Sao_Paulo') 
            BETWEEN data_inicio AND data_fim
    ), 0)::integer AS portas_soldadas,
    
    -- Separadas: contagem de pedidos com separação concluída
    COALESCE((
      SELECT COUNT(DISTINCT os.pedido_id)::integer
      FROM ordens_separacao os
      WHERE os.status = 'concluido'
        AND DATE(os.data_conclusao AT TIME ZONE 'America/Sao_Paulo') 
            BETWEEN data_inicio AND data_fim
    ), 0)::integer AS pedidos_separados,
    
    -- Pintura: m² das porta_enrolar em pedidos com pintura concluída
    COALESCE((
      SELECT SUM((pv.largura / 1000.0) * (pv.altura / 1000.0) * pv.quantidade)
      FROM ordens_pintura op
      JOIN pedidos_producao pp ON pp.id = op.pedido_id
      JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id 
           AND pv.tipo_produto = 'porta_enrolar'
      WHERE op.status = 'concluido'
        AND DATE(op.data_conclusao AT TIME ZONE 'America/Sao_Paulo') 
            BETWEEN data_inicio AND data_fim
        AND pv.largura IS NOT NULL 
        AND pv.altura IS NOT NULL
    ), 0)::numeric AS pintura_m2,
    
    -- Carregamentos: contagem de carregamentos concluídos
    COALESCE((
      SELECT COUNT(*)::integer
      FROM ordens_carregamento oc
      WHERE oc.carregamento_concluido = true
        AND DATE(oc.carregamento_concluido_em AT TIME ZONE 'America/Sao_Paulo') 
            BETWEEN data_inicio AND data_fim
    ), 0)::integer AS carregamentos;
END;
$$;

-- Criar função para desempenho por colaborador com filtro de data
CREATE OR REPLACE FUNCTION public.get_desempenho_etapas(data_inicio date, data_fim date)
RETURNS TABLE(
  user_id uuid,
  nome text,
  foto_perfil_url text,
  perfiladas_metros numeric,
  soldadas bigint,
  separadas bigint,
  pintura_m2 numeric,
  carregamentos bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  
  WITH perfiladeira AS (
    SELECT 
      lo.concluida_por as uid,
      SUM(
        CASE 
          WHEN lo.tamanho ~ '^[0-9]+([.,][0-9]+)?$' 
          THEN CAST(REPLACE(lo.tamanho, ',', '.') AS numeric) * lo.quantidade
          ELSE 0
        END
      ) as valor
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'perfiladeira'
      AND lo.concluida = true
      AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') 
          BETWEEN data_inicio AND data_fim
      AND lo.concluida_por IS NOT NULL
    GROUP BY lo.concluida_por
  ),
  soldagem AS (
    SELECT 
      os.responsavel_id as uid,
      SUM(pv.quantidade) as valor
    FROM ordens_soldagem os
    JOIN pedidos_producao pp ON pp.id = os.pedido_id
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id 
         AND pv.tipo_produto = 'porta_enrolar'
    WHERE os.status = 'concluido'
      AND DATE(os.data_conclusao AT TIME ZONE 'America/Sao_Paulo') 
          BETWEEN data_inicio AND data_fim
      AND os.responsavel_id IS NOT NULL
    GROUP BY os.responsavel_id
  ),
  separacao AS (
    SELECT 
      os.responsavel_id as uid,
      COUNT(DISTINCT os.pedido_id) as valor
    FROM ordens_separacao os
    WHERE os.status = 'concluido'
      AND DATE(os.data_conclusao AT TIME ZONE 'America/Sao_Paulo') 
          BETWEEN data_inicio AND data_fim
      AND os.responsavel_id IS NOT NULL
    GROUP BY os.responsavel_id
  ),
  pintura AS (
    SELECT 
      op.responsavel_id as uid,
      SUM((pv.largura / 1000.0) * (pv.altura / 1000.0) * pv.quantidade) as valor
    FROM ordens_pintura op
    JOIN pedidos_producao pp ON pp.id = op.pedido_id
    JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id 
         AND pv.tipo_produto = 'porta_enrolar'
    WHERE op.status = 'concluido'
      AND DATE(op.data_conclusao AT TIME ZONE 'America/Sao_Paulo') 
          BETWEEN data_inicio AND data_fim
      AND pv.largura IS NOT NULL 
      AND pv.altura IS NOT NULL
      AND op.responsavel_id IS NOT NULL
    GROUP BY op.responsavel_id
  ),
  carregamento AS (
    SELECT 
      oc.carregamento_concluido_por as uid,
      COUNT(*) as valor
    FROM ordens_carregamento oc
    WHERE oc.carregamento_concluido = true
      AND DATE(oc.carregamento_concluido_em AT TIME ZONE 'America/Sao_Paulo') 
          BETWEEN data_inicio AND data_fim
      AND oc.carregamento_concluido_por IS NOT NULL
    GROUP BY oc.carregamento_concluido_por
  ),
  todos_users AS (
    SELECT uid FROM perfiladeira
    UNION SELECT uid FROM soldagem
    UNION SELECT uid FROM separacao
    UNION SELECT uid FROM pintura
    UNION SELECT uid FROM carregamento
  )
  SELECT 
    au.user_id,
    au.nome::text,
    au.foto_perfil_url::text,
    COALESCE(pe.valor, 0)::numeric as perfiladas_metros,
    COALESCE(so.valor, 0)::bigint as soldadas,
    COALESCE(se.valor, 0)::bigint as separadas,
    COALESCE(pi.valor, 0)::numeric as pintura_m2,
    COALESCE(ca.valor, 0)::bigint as carregamentos
  FROM todos_users tu
  JOIN admin_users au ON au.user_id = tu.uid
  LEFT JOIN perfiladeira pe ON pe.uid = tu.uid
  LEFT JOIN soldagem so ON so.uid = tu.uid
  LEFT JOIN separacao se ON se.uid = tu.uid
  LEFT JOIN pintura pi ON pi.uid = tu.uid
  LEFT JOIN carregamento ca ON ca.uid = tu.uid;
END;
$$;