CREATE OR REPLACE FUNCTION public.get_metas_colaboradores_mes()
RETURNS TABLE(
  user_id uuid,
  nome text,
  foto_perfil_url text,
  solda_qtd bigint,
  perfiladeira_metros numeric,
  separacao_qtd bigint,
  qualidade_qtd bigint,
  pintura_m2 numeric,
  carregamento_qtd bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH 
  colaboradores AS (
    SELECT au.user_id, au.nome, au.foto_perfil_url
    FROM admin_users au
    WHERE au.ativo = true 
      AND au.setor = 'fabrica' 
      AND au.eh_colaborador = true
  ),
  solda_stats AS (
    SELECT lo.concluida_por as uid, 
           COUNT(*) as qtd
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'soldagem'
      AND lo.concluida = true
      AND lo.concluida_em >= date_trunc('month', CURRENT_DATE)
      AND LOWER(lo.item) LIKE '%porta%enrolar%'
    GROUP BY lo.concluida_por
  ),
  perfiladeira_stats AS (
    SELECT lo.concluida_por as uid,
           SUM(
             CASE 
               WHEN lo.tamanho IS NOT NULL AND lo.tamanho ~ '^[0-9]+([,\.][0-9]+)?$' 
               THEN REPLACE(lo.tamanho, ',', '.')::numeric * COALESCE(lo.quantidade, 1)
               ELSE 0
             END
           ) as metros
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'perfiladeira'
      AND lo.concluida = true
      AND lo.concluida_em >= date_trunc('month', CURRENT_DATE)
    GROUP BY lo.concluida_por
  ),
  separacao_stats AS (
    SELECT os.responsavel_id as uid, COUNT(*) as qtd
    FROM ordens_separacao os
    WHERE os.status = 'concluido'
      AND os.data_conclusao >= date_trunc('month', CURRENT_DATE)
    GROUP BY os.responsavel_id
  ),
  qualidade_stats AS (
    SELECT oq.responsavel_id as uid, COUNT(*) as qtd
    FROM ordens_qualidade oq
    WHERE oq.status = 'concluido'
      AND oq.data_conclusao >= date_trunc('month', CURRENT_DATE)
    GROUP BY oq.responsavel_id
  ),
  pintura_stats AS (
    SELECT lo.concluida_por as uid,
           SUM((COALESCE(lo.largura, 0) / 1000.0) * (COALESCE(lo.altura, 0) / 1000.0) * COALESCE(lo.quantidade, 1)) as m2
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'pintura'
      AND lo.concluida = true
      AND lo.concluida_em >= date_trunc('month', CURRENT_DATE)
    GROUP BY lo.concluida_por
  ),
  carregamento_stats AS (
    SELECT oc.carregamento_concluido_por as uid, COUNT(*) as qtd
    FROM ordens_carregamento oc
    WHERE oc.carregamento_concluido = true
      AND oc.carregamento_concluido_em >= date_trunc('month', CURRENT_DATE)
    GROUP BY oc.carregamento_concluido_por
  )
  SELECT 
    c.user_id,
    c.nome,
    c.foto_perfil_url,
    COALESCE(ss.qtd, 0)::bigint as solda_qtd,
    COALESCE(ps.metros, 0)::numeric as perfiladeira_metros,
    COALESCE(sep.qtd, 0)::bigint as separacao_qtd,
    COALESCE(qual.qtd, 0)::bigint as qualidade_qtd,
    COALESCE(pint.m2, 0)::numeric as pintura_m2,
    COALESCE(car.qtd, 0)::bigint as carregamento_qtd
  FROM colaboradores c
  LEFT JOIN solda_stats ss ON ss.uid = c.user_id
  LEFT JOIN perfiladeira_stats ps ON ps.uid = c.user_id
  LEFT JOIN separacao_stats sep ON sep.uid = c.user_id
  LEFT JOIN qualidade_stats qual ON qual.uid = c.user_id
  LEFT JOIN pintura_stats pint ON pint.uid = c.user_id
  LEFT JOIN carregamento_stats car ON car.uid = c.user_id
  ORDER BY c.nome;
END;
$$;