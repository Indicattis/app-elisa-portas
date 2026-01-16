-- Função para obter métricas de desempenho dos colaboradores no mês atual
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
  -- Colaboradores da fábrica
  colaboradores AS (
    SELECT au.user_id, au.nome::text, au.foto_perfil_url::text
    FROM admin_users au
    WHERE au.ativo = true 
      AND au.setor = 'fabrica' 
      AND au.eh_colaborador = true
  ),
  -- Solda: quantidade de ordens de soldagem concluídas
  solda_stats AS (
    SELECT os.responsavel_id as user_id, 
           COUNT(*)::bigint as qtd
    FROM ordens_soldagem os
    WHERE os.status = 'concluido'
      AND os.data_conclusao >= date_trunc('month', CURRENT_DATE)
    GROUP BY os.responsavel_id
  ),
  -- Perfiladeira: metros produzidos (soma de linhas concluídas)
  perfiladeira_stats AS (
    SELECT lo.concluida_por::uuid as user_id,
           SUM(COALESCE(lo.altura, 0) / 1000.0 * COALESCE(lo.quantidade, 1))::numeric as metros
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'perfiladeira'
      AND lo.concluida = true
      AND lo.concluida_em >= date_trunc('month', CURRENT_DATE)
    GROUP BY lo.concluida_por
  ),
  -- Separação: quantidade de ordens concluídas
  separacao_stats AS (
    SELECT os.responsavel_id as user_id, COUNT(*)::bigint as qtd
    FROM ordens_separacao os
    WHERE os.status = 'concluido'
      AND os.data_conclusao >= date_trunc('month', CURRENT_DATE)
    GROUP BY os.responsavel_id
  ),
  -- Qualidade: quantidade de ordens concluídas
  qualidade_stats AS (
    SELECT oq.responsavel_id as user_id, COUNT(*)::bigint as qtd
    FROM ordens_qualidade oq
    WHERE oq.status = 'concluido'
      AND oq.data_conclusao >= date_trunc('month', CURRENT_DATE)
    GROUP BY oq.responsavel_id
  ),
  -- Pintura: m² de portas pintadas (largura * altura em metros)
  pintura_stats AS (
    SELECT lo.concluida_por::uuid as user_id,
           SUM((COALESCE(lo.largura, 0) / 1000.0) * (COALESCE(lo.altura, 0) / 1000.0) * COALESCE(lo.quantidade, 1))::numeric as m2
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'pintura'
      AND lo.concluida = true
      AND lo.concluida_em >= date_trunc('month', CURRENT_DATE)
    GROUP BY lo.concluida_por
  ),
  -- Carregamento: quantidade de carregamentos concluídos
  carregamento_stats AS (
    SELECT oc.carregamento_concluido_por::uuid as user_id, COUNT(*)::bigint as qtd
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
  LEFT JOIN solda_stats ss ON ss.user_id = c.user_id
  LEFT JOIN perfiladeira_stats ps ON ps.user_id = c.user_id
  LEFT JOIN separacao_stats sep ON sep.user_id = c.user_id
  LEFT JOIN qualidade_stats qual ON qual.user_id = c.user_id
  LEFT JOIN pintura_stats pint ON pint.user_id = c.user_id
  LEFT JOIN carregamento_stats car ON car.user_id = c.user_id
  ORDER BY c.nome;
END;
$$;

-- Registrar a rota no app_routes
INSERT INTO public.app_routes (key, label, path, icon, description, interface, active, sort_order)
VALUES ('metas', 'Metas', '/hub-fabrica/metas', 'Target', 'Desempenho dos colaboradores', 'hub', true, 100)
ON CONFLICT (key) DO NOTHING;