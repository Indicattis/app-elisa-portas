-- Função para obter portas produzidas na semana atual
CREATE OR REPLACE FUNCTION get_portas_enrolar_produzidas_semana()
RETURNS integer AS $$
SELECT COALESCE(SUM(pv.quantidade)::integer, 0)
FROM produtos_vendas pv
JOIN vendas v ON pv.venda_id = v.id
JOIN pedidos_producao pp ON v.id = pp.venda_id
WHERE pv.tipo_produto = 'porta_enrolar'
  AND pp.status = 'concluido'
  AND pp.updated_at >= date_trunc('week', CURRENT_DATE)
  AND pp.updated_at < date_trunc('week', CURRENT_DATE) + interval '7 days';
$$ LANGUAGE sql STABLE;

-- Função para obter desempenho geral de produção por período
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
    SELECT data_conclusao::date AS dia, COUNT(*) AS total
    FROM ordens_perfiladeira
    WHERE concluida = true
      AND data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    GROUP BY data_conclusao::date
  ),
  soldadas AS (
    SELECT data_conclusao::date AS dia, COUNT(*) AS total
    FROM ordens_soldagem
    WHERE concluida = true
      AND data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    GROUP BY data_conclusao::date
  ),
  separadas AS (
    SELECT data_conclusao::date AS dia, COUNT(*) AS total
    FROM ordens_separacao
    WHERE concluida = true
      AND data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    GROUP BY data_conclusao::date
  ),
  pintadas AS (
    SELECT data_conclusao::date AS dia, COUNT(*) AS total
    FROM ordens_pintura
    WHERE status = 'pronta'
      AND data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    GROUP BY data_conclusao::date
  ),
  carregadas AS (
    SELECT carregamento_concluido_em::date AS dia, COUNT(*) AS total
    FROM ordens_carregamento
    WHERE carregamento_concluido = true
      AND carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    GROUP BY carregamento_concluido_em::date
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