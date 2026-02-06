
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa(p_data_inicio date, p_data_fim date)
 RETURNS TABLE(metros_perfilados numeric, portas_soldadas bigint, pedidos_separados bigint, pintura_m2 numeric, carregamentos bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      SELECT SUM(pl.largura * pl.altura / 1000000.0)
      FROM ordens_pintura op
      JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
      WHERE op.status = 'pronta'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pl.largura IS NOT NULL
        AND pl.altura IS NOT NULL
    ), 0)::numeric AS pintura_m2,
    COALESCE((
      SELECT COUNT(*)
      FROM instalacoes i
      WHERE i.carregamento_concluido = true
        AND i.carregamento_concluido_em::date BETWEEN p_data_inicio AND p_data_fim
    ), 0)::bigint AS carregamentos;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_desempenho_etapas(p_data_inicio date, p_data_fim date)
 RETURNS TABLE(user_id uuid, nome text, foto_perfil_url text, perfiladas_metros numeric, soldadas bigint, soldadas_p bigint, soldadas_g bigint, separadas bigint, pintura_m2 numeric, carregamentos bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      SELECT SUM(pl.largura * pl.altura / 1000000.0)
      FROM ordens_pintura op
      JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
      WHERE op.responsavel_id = au.user_id
        AND op.status = 'pronta'
        AND op.data_conclusao::date BETWEEN p_data_inicio AND p_data_fim
        AND pl.largura IS NOT NULL
        AND pl.altura IS NOT NULL
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
$function$;
