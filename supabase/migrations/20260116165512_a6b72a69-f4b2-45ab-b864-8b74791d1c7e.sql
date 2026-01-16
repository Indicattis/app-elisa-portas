-- Recriar função para usar a mesma lógica de linhas_ordens
CREATE OR REPLACE FUNCTION get_desempenho_producao_geral(
  p_data_inicio date,
  p_data_fim date
)
RETURNS TABLE (
  data date,
  dia_semana text,
  portas_perfiladas bigint,
  portas_soldadas bigint,
  portas_separadas bigint,
  portas_pintadas bigint,
  portas_carregadas bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH datas AS (
    SELECT generate_series(p_data_inicio, p_data_fim, '1 day'::interval)::date AS dia
  ),
  perfiladas AS (
    SELECT 
      DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') AS dia,
      COUNT(DISTINCT CONCAT(lo.produto_venda_id, '-', COALESCE(lo.indice_porta, 0))) AS total
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'perfiladeira'
      AND lo.concluida = true
      AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo')
  ),
  soldadas AS (
    SELECT 
      DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') AS dia,
      COUNT(DISTINCT CONCAT(lo.produto_venda_id, '-', COALESCE(lo.indice_porta, 0))) AS total
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'soldagem'
      AND lo.concluida = true
      AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo')
  ),
  separadas AS (
    SELECT 
      DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') AS dia,
      COUNT(DISTINCT CONCAT(lo.produto_venda_id, '-', COALESCE(lo.indice_porta, 0))) AS total
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'separacao'
      AND lo.concluida = true
      AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo')
  ),
  pintadas AS (
    SELECT 
      DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') AS dia,
      COUNT(DISTINCT CONCAT(lo.produto_venda_id, '-', COALESCE(lo.indice_porta, 0))) AS total
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'pintura'
      AND lo.concluida = true
      AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo')
  ),
  carregadas AS (
    SELECT 
      DATE(i.carregamento_concluido_em AT TIME ZONE 'America/Sao_Paulo') AS dia,
      COUNT(*) AS total
    FROM instalacoes i
    WHERE i.carregamento_concluido = true
      AND DATE(i.carregamento_concluido_em AT TIME ZONE 'America/Sao_Paulo') BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(i.carregamento_concluido_em AT TIME ZONE 'America/Sao_Paulo')
  )
  SELECT 
    d.dia AS data,
    to_char(d.dia, 'Dy') AS dia_semana,
    COALESCE(pf.total, 0) AS portas_perfiladas,
    COALESCE(so.total, 0) AS portas_soldadas,
    COALESCE(se.total, 0) AS portas_separadas,
    COALESCE(pi.total, 0) AS portas_pintadas,
    COALESCE(ca.total, 0) AS portas_carregadas
  FROM datas d
  LEFT JOIN perfiladas pf ON d.dia = pf.dia
  LEFT JOIN soldadas so ON d.dia = so.dia
  LEFT JOIN separadas se ON d.dia = se.dia
  LEFT JOIN pintadas pi ON d.dia = pi.dia
  LEFT JOIN carregadas ca ON d.dia = ca.dia
  ORDER BY d.dia;
END;
$$ LANGUAGE plpgsql STABLE;