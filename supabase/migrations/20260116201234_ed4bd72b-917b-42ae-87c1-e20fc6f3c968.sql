-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_portas_por_etapa(date, date);
DROP FUNCTION IF EXISTS public.get_desempenho_etapas(date, date);

-- Recreate get_portas_por_etapa - separação via linhas_ordens, não pedidos_producao
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa(
  p_data_inicio date, 
  p_data_fim date
)
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
    -- Metros perfilados (soma de largura * quantidade das linhas concluídas de perfiladeira)
    COALESCE((
      SELECT SUM((lo.largura::numeric / 1000.0) * lo.quantidade)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS metros_perfilados,
    
    -- Portas soldadas (conta linhas de soldagem concluídas)
    COALESCE((
      SELECT COUNT(*)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'soldagem'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS portas_soldadas,
    
    -- Pedidos separados (conta linhas de separação concluídas - cada linha = 1 pedido separado)
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'separacao'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS pedidos_separados,
    
    -- Pintura m² (soma área das linhas de pintura concluídas)
    COALESCE((
      SELECT SUM((lo.largura::numeric / 1000.0) * (lo.altura::numeric / 1000.0) * lo.quantidade)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'pintura'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS pintura_m2,
    
    -- Carregamentos (conta instalações com carregamento concluído)
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS carregamentos;
END;
$$;

-- Recreate get_desempenho_etapas - separação via linhas_ordens
CREATE OR REPLACE FUNCTION public.get_desempenho_etapas(
  p_data_inicio date, 
  p_data_fim date
)
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH perfiladeira AS (
    SELECT 
      lo.concluida_por AS uid,
      SUM((lo.largura::numeric / 1000.0) * lo.quantidade) AS metros
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'perfiladeira'
      AND lo.concluida = true
      AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
      AND lo.concluida_por IS NOT NULL
    GROUP BY lo.concluida_por
  ),
  solda AS (
    SELECT 
      lo.concluida_por AS uid,
      COUNT(*) AS qtd
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'soldagem'
      AND lo.concluida = true
      AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
      AND lo.concluida_por IS NOT NULL
    GROUP BY lo.concluida_por
  ),
  separacao AS (
    SELECT 
      lo.concluida_por AS uid,
      COUNT(DISTINCT lo.pedido_id) AS qtd
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'separacao'
      AND lo.concluida = true
      AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
      AND lo.concluida_por IS NOT NULL
    GROUP BY lo.concluida_por
  ),
  pintura AS (
    SELECT 
      lo.concluida_por AS uid,
      SUM((lo.largura::numeric / 1000.0) * (lo.altura::numeric / 1000.0) * lo.quantidade) AS m2
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'pintura'
      AND lo.concluida = true
      AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
      AND lo.concluida_por IS NOT NULL
    GROUP BY lo.concluida_por
  ),
  carreg AS (
    SELECT 
      i.carregamento_concluido_por AS uid,
      COUNT(*) AS qtd
    FROM instalacoes i
    WHERE i.carregamento_concluido = true
      AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
      AND i.carregamento_concluido_por IS NOT NULL
    GROUP BY i.carregamento_concluido_por
  ),
  all_users AS (
    SELECT uid FROM perfiladeira
    UNION SELECT uid FROM solda
    UNION SELECT uid FROM separacao
    UNION SELECT uid FROM pintura
    UNION SELECT uid FROM carreg
  )
  SELECT 
    au.uid AS user_id,
    COALESCE(adm.nome, 'Usuário') AS nome,
    adm.foto_perfil_url AS foto_perfil_url,
    COALESCE(pf.metros, 0) AS perfiladas_metros,
    COALESCE(sl.qtd, 0) AS soldadas,
    COALESCE(sp.qtd, 0) AS separadas,
    COALESCE(pt.m2, 0) AS pintura_m2,
    COALESCE(cr.qtd, 0) AS carregamentos
  FROM all_users au
  LEFT JOIN admin_users adm ON adm.user_id = au.uid
  LEFT JOIN perfiladeira pf ON pf.uid = au.uid
  LEFT JOIN solda sl ON sl.uid = au.uid
  LEFT JOIN separacao sp ON sp.uid = au.uid
  LEFT JOIN pintura pt ON pt.uid = au.uid
  LEFT JOIN carreg cr ON cr.uid = au.uid
  ORDER BY 
    COALESCE(pf.metros, 0) + COALESCE(sl.qtd, 0) + COALESCE(sp.qtd, 0) + COALESCE(pt.m2, 0) + COALESCE(cr.qtd, 0) DESC;
END;
$$;