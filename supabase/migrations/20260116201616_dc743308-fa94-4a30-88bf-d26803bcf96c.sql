-- Corrigir cálculo de metros perfilados usando campo tamanho (texto com vírgula)
-- Em vez de largura (que está NULL)

DROP FUNCTION IF EXISTS public.get_portas_por_etapa(date, date);
DROP FUNCTION IF EXISTS public.get_desempenho_etapas(date, date);

-- Função para métricas gerais por etapa
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa(
  p_data_inicio date,
  p_data_fim date
)
RETURNS TABLE (
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
    -- Metros perfilados: usando campo tamanho (texto com vírgula como decimal)
    COALESCE((
      SELECT SUM(REPLACE(lo.tamanho, ',', '.')::numeric * lo.quantidade)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS metros_perfilados,
    
    -- Portas soldadas
    COALESCE((
      SELECT COUNT(*)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'soldagem'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS portas_soldadas,
    
    -- Pedidos separados (contando pedidos distintos com linhas de separação concluídas)
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'separacao'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS pedidos_separados,
    
    -- Pintura m² (placeholder)
    0::numeric AS pintura_m2,
    
    -- Carregamentos concluídos
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS carregamentos;
END;
$$;

-- Função para desempenho por colaborador
CREATE OR REPLACE FUNCTION public.get_desempenho_etapas(
  p_data_inicio date,
  p_data_fim date
)
RETURNS TABLE (
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
  SELECT
    au.user_id,
    au.nome,
    au.foto_perfil_url,
    -- Perfiladas (metros): usando campo tamanho (texto com vírgula)
    COALESCE((
      SELECT SUM(REPLACE(lo.tamanho, ',', '.')::numeric * lo.quantidade)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.concluida_por = au.user_id
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS perfiladas_metros,
    -- Soldadas (quantidade de linhas)
    COALESCE((
      SELECT COUNT(*)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'soldagem'
        AND lo.concluida = true
        AND lo.concluida_por = au.user_id
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS soldadas,
    -- Separadas (quantidade de linhas)
    COALESCE((
      SELECT COUNT(*)
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'separacao'
        AND lo.concluida = true
        AND lo.concluida_por = au.user_id
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS separadas,
    -- Pintura m² (placeholder)
    0::numeric AS pintura_m2,
    -- Carregamentos
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_por = au.user_id
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0) AS carregamentos
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true
  ORDER BY au.nome;
END;
$$;