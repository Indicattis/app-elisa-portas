-- Primeiro remover a função existente
DROP FUNCTION IF EXISTS public.get_portas_por_etapa_hoje();

-- Recriar função get_portas_por_etapa_hoje com novos campos
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa_hoje()
RETURNS TABLE(
  portas_perfiladas integer,
  portas_soldadas integer,
  portas_separadas integer,
  metragem_perfilada numeric,
  pintura_m2_hoje numeric,
  carregamentos_hoje integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)::integer
      FROM linhas_ordens lo
      WHERE lo.setor = 'perfiladeira'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS portas_perfiladas,
    
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)::integer
      FROM linhas_ordens lo
      WHERE lo.setor = 'solda'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS portas_soldadas,
    
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)::integer
      FROM linhas_ordens lo
      WHERE lo.setor = 'separacao'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS portas_separadas,
    
    COALESCE((
      SELECT SUM(lo.metragem)
      FROM linhas_ordens lo
      WHERE lo.setor = 'perfiladeira'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS metragem_perfilada,
    
    COALESCE((
      SELECT SUM((lo.largura::numeric / 1000) * (lo.altura::numeric / 1000) * COALESCE(lo.quantidade, 1))
      FROM linhas_ordens lo
      WHERE lo.setor = 'pintura'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS pintura_m2_hoje,
    
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)::integer
      FROM linhas_ordens lo
      WHERE lo.setor = 'carregamento'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS carregamentos_hoje;
END;
$$;

-- Criar função para desempenho por colaborador do dia
CREATE OR REPLACE FUNCTION public.get_desempenho_etapas_hoje()
RETURNS TABLE(
  user_id uuid,
  nome text,
  foto_perfil_url text,
  perfiladas bigint,
  perfiladeira_metros numeric,
  soldadas bigint,
  separadas bigint,
  pintura_m2 numeric,
  carregamentos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.user_id,
    au.nome,
    au.foto_perfil_url,
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)
      FROM linhas_ordens lo
      WHERE lo.concluido_por = au.user_id
        AND lo.setor = 'perfiladeira'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS perfiladas,
    COALESCE((
      SELECT SUM(lo.metragem)
      FROM linhas_ordens lo
      WHERE lo.concluido_por = au.user_id
        AND lo.setor = 'perfiladeira'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS perfiladeira_metros,
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)
      FROM linhas_ordens lo
      WHERE lo.concluido_por = au.user_id
        AND lo.setor = 'solda'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS soldadas,
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)
      FROM linhas_ordens lo
      WHERE lo.concluido_por = au.user_id
        AND lo.setor = 'separacao'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS separadas,
    COALESCE((
      SELECT SUM((lo.largura::numeric / 1000) * (lo.altura::numeric / 1000) * COALESCE(lo.quantidade, 1))
      FROM linhas_ordens lo
      WHERE lo.concluido_por = au.user_id
        AND lo.setor = 'pintura'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS pintura_m2,
    COALESCE((
      SELECT COUNT(DISTINCT lo.pedido_id)
      FROM linhas_ordens lo
      WHERE lo.concluido_por = au.user_id
        AND lo.setor = 'carregamento'
        AND lo.concluido = true
        AND DATE(lo.concluido_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ), 0) AS carregamentos
  FROM admin_users au
  WHERE au.ativo = true
    AND au.eh_colaborador = true;
END;
$$;