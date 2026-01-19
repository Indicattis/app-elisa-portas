-- Fix: Calculate pintura_m2 from pedido_linhas (largura * altura / 1000000) instead of non-existent op.area_m2

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
    -- Metros perfilados (ordens_perfiladeira)
    COALESCE((
      SELECT SUM(oper.metros_produzidos)
      FROM ordens_perfiladeira oper
      WHERE oper.status = 'concluido'
        AND oper.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS metros_perfilados,
    
    -- Portas soldadas (ordens_soldagem)
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      WHERE os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS portas_soldadas,
    
    -- Pedidos separados (ordens_separacao)
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_separacao osep
      WHERE osep.status = 'concluido'
        AND osep.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS pedidos_separados,
    
    -- Pintura m² (calculado via pedido_linhas)
    COALESCE((
      SELECT SUM(pl.largura * pl.altura / 1000000.0)
      FROM ordens_pintura op
      JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
      WHERE op.status = 'concluido'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pl.largura IS NOT NULL
        AND pl.altura IS NOT NULL
    ), 0)::numeric AS pintura_m2,
    
    -- Carregamentos (instalacoes com carregamento concluído)
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos;
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
    
    -- Metros perfilados
    COALESCE((
      SELECT SUM(oper.metros_produzidos)
      FROM ordens_perfiladeira oper
      WHERE oper.responsavel_id = au.user_id
        AND oper.status = 'concluido'
        AND oper.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS perfiladas_metros,
    
    -- Portas soldadas
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas,
    
    -- Pedidos separados
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_separacao osep
      WHERE osep.responsavel_id = au.user_id
        AND osep.status = 'concluido'
        AND osep.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS separadas,
    
    -- Pintura m² (calculado via pedido_linhas)
    COALESCE((
      SELECT SUM(pl.largura * pl.altura / 1000000.0)
      FROM ordens_pintura op
      JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
      WHERE op.responsavel_id = au.user_id
        AND op.status = 'concluido'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pl.largura IS NOT NULL
        AND pl.altura IS NOT NULL
    ), 0)::numeric AS pintura_m2,
    
    -- Carregamentos
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.responsavel_carregamento_id = au.user_id::text
        AND i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos
    
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true;
END;
$$;