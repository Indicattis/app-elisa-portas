-- Corrigir funções usando linhas_ordens para perfiladeira
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa(p_data_inicio date, p_data_fim date)
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
    -- Metros perfilados (quantidade * tamanho de linhas_ordens perfiladeira)
    COALESCE((
      SELECT SUM(lo.quantidade * COALESCE(NULLIF(lo.tamanho, '')::numeric, 0))
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::numeric) AS metros_perfilados,
    
    -- Portas soldadas (conta portas via pedido_porta_observacoes)
    COALESCE((
      SELECT COUNT(ppo.id)
      FROM ordens_soldagem os
      JOIN pedido_porta_observacoes ppo ON ppo.pedido_id = os.pedido_id
      WHERE os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::bigint) AS portas_soldadas,
    
    -- Pedidos separados (pedidos distintos em ordens_separacao)
    COALESCE((
      SELECT COUNT(DISTINCT pedido_id)
      FROM ordens_separacao
      WHERE status = 'concluido'
        AND data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::bigint) AS pedidos_separados,
    
    -- Pintura m²
    COALESCE((
      SELECT SUM(op.area_m2)
      FROM ordens_pintura op
      WHERE op.status = 'concluido'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::numeric) AS pintura_m2,
    
    -- Carregamentos
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::bigint) AS carregamentos;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_desempenho_etapas(p_data_inicio date, p_data_fim date)
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
  SELECT 
    au.user_id,
    au.nome,
    au.foto_perfil_url,
    -- Metros perfilados por colaborador
    COALESCE((
      SELECT SUM(lo.quantidade * COALESCE(NULLIF(lo.tamanho, '')::numeric, 0))
      FROM linhas_ordens lo
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida_por = au.user_id
        AND lo.concluida = true
        AND lo.concluida_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::numeric) AS perfiladas_metros,
    
    -- Portas soldadas por colaborador
    COALESCE((
      SELECT COUNT(ppo.id)
      FROM ordens_soldagem os
      JOIN pedido_porta_observacoes ppo ON ppo.pedido_id = os.pedido_id
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::bigint) AS soldadas,
    
    -- Pedidos separados por colaborador
    COALESCE((
      SELECT COUNT(DISTINCT pedido_id)
      FROM ordens_separacao
      WHERE responsavel_id = au.user_id
        AND status = 'concluido'
        AND data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::bigint) AS separadas,
    
    -- Pintura m² por colaborador
    COALESCE((
      SELECT SUM(op.area_m2)
      FROM ordens_pintura op
      WHERE op.responsavel_id = au.user_id
        AND op.status = 'concluido'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::numeric) AS pintura_m2,
    
    -- Carregamentos por colaborador
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.responsavel_carregamento_id = au.user_id::text
        AND i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0::bigint) AS carregamentos
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true
  ORDER BY au.nome;
END;
$$;