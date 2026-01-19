-- Drop and recreate function with new return type including soldadas_p and soldadas_g

DROP FUNCTION IF EXISTS public.get_desempenho_etapas(date, date);

CREATE OR REPLACE FUNCTION public.get_desempenho_etapas(p_data_inicio date, p_data_fim date)
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
    
    -- Metros perfilados (calculado via linhas_ordens)
    COALESCE((
      SELECT SUM(lo.quantidade * REPLACE(lo.tamanho, ',', '.')::numeric)
      FROM linhas_ordens lo
      JOIN ordens_perfiladeira op ON op.id = lo.ordem_id
      WHERE lo.tipo_ordem = 'perfiladeira'
        AND lo.concluida = true
        AND lo.tamanho IS NOT NULL
        AND op.responsavel_id = au.user_id
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::numeric AS perfiladas_metros,
    
    -- Portas soldadas (total)
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS soldadas,
    
    -- Portas soldadas pequenas (área <= 9m² - ex: 3x3)
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      JOIN pedidos_producao pp ON pp.id = os.pedido_id
      JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
        AND pv.largura IS NOT NULL
        AND pv.altura IS NOT NULL
        AND (pv.largura * pv.altura / 1000000.0) <= 9
    ), 0)::bigint AS soldadas_p,
    
    -- Portas soldadas grandes (área > 9m²)
    COALESCE((
      SELECT COUNT(*)
      FROM ordens_soldagem os
      JOIN pedidos_producao pp ON pp.id = os.pedido_id
      JOIN produtos_vendas pv ON pv.venda_id = pp.venda_id
      WHERE os.responsavel_id = au.user_id
        AND os.status = 'concluido'
        AND os.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pv.tipo_produto IN ('porta_enrolar', 'porta_social')
        AND pv.largura IS NOT NULL
        AND pv.altura IS NOT NULL
        AND (pv.largura * pv.altura / 1000000.0) > 9
    ), 0)::bigint AS soldadas_g,
    
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
      WHERE i.responsavel_carregamento_id = au.user_id
        AND i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos
    
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true;
END;
$$;