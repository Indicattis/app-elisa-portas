-- Tabela para metas dos colaboradores
CREATE TABLE public.metas_colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo_meta text NOT NULL CHECK (tipo_meta IN ('solda', 'perfiladeira', 'separacao', 'qualidade', 'pintura', 'carregamento')),
  valor_meta numeric NOT NULL,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_termino date NOT NULL,
  recompensa_valor numeric NOT NULL DEFAULT 0,
  concluida boolean DEFAULT false,
  concluida_em timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- RLS
ALTER TABLE public.metas_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read metas" ON public.metas_colaboradores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert metas" ON public.metas_colaboradores
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update metas" ON public.metas_colaboradores
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete metas" ON public.metas_colaboradores
  FOR DELETE TO authenticated USING (true);

-- RPC para desempenho diário do colaborador
CREATE OR REPLACE FUNCTION public.get_desempenho_diario_colaborador(
  p_user_id uuid,
  p_data_inicio date,
  p_data_fim date
)
RETURNS TABLE(
  data date,
  dia_semana text,
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
  datas AS (
    SELECT generate_series(p_data_inicio, p_data_fim, '1 day'::interval)::date as dia
  ),
  solda_stats AS (
    SELECT DATE(lo.concluida_em) as dia, COUNT(*) as qtd
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'soldagem'
      AND lo.concluida = true
      AND lo.concluida_por = p_user_id
      AND DATE(lo.concluida_em) BETWEEN p_data_inicio AND p_data_fim
      AND LOWER(lo.item) LIKE '%porta%enrolar%'
    GROUP BY DATE(lo.concluida_em)
  ),
  perfiladeira_stats AS (
    SELECT DATE(lo.concluida_em) as dia,
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
      AND lo.concluida_por = p_user_id
      AND DATE(lo.concluida_em) BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(lo.concluida_em)
  ),
  separacao_stats AS (
    SELECT DATE(os.data_conclusao) as dia, COUNT(*) as qtd
    FROM ordens_separacao os
    WHERE os.status = 'concluido'
      AND os.responsavel_id = p_user_id
      AND DATE(os.data_conclusao) BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(os.data_conclusao)
  ),
  qualidade_stats AS (
    SELECT DATE(oq.data_conclusao) as dia, COUNT(*) as qtd
    FROM ordens_qualidade oq
    WHERE oq.status = 'concluido'
      AND oq.responsavel_id = p_user_id
      AND DATE(oq.data_conclusao) BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(oq.data_conclusao)
  ),
  pintura_stats AS (
    SELECT DATE(lo.concluida_em) as dia,
           SUM((COALESCE(lo.largura, 0) / 1000.0) * (COALESCE(lo.altura, 0) / 1000.0) * COALESCE(lo.quantidade, 1)) as m2
    FROM linhas_ordens lo
    WHERE lo.tipo_ordem = 'pintura'
      AND lo.concluida = true
      AND lo.concluida_por = p_user_id
      AND DATE(lo.concluida_em) BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(lo.concluida_em)
  ),
  carregamento_stats AS (
    SELECT DATE(oc.carregamento_concluido_em) as dia, COUNT(*) as qtd
    FROM ordens_carregamento oc
    WHERE oc.carregamento_concluido = true
      AND oc.carregamento_concluido_por = p_user_id
      AND DATE(oc.carregamento_concluido_em) BETWEEN p_data_inicio AND p_data_fim
    GROUP BY DATE(oc.carregamento_concluido_em)
  )
  SELECT 
    d.dia as data,
    TO_CHAR(d.dia, 'Dy') as dia_semana,
    COALESCE(ss.qtd, 0)::bigint as solda_qtd,
    COALESCE(ps.metros, 0)::numeric as perfiladeira_metros,
    COALESCE(sep.qtd, 0)::bigint as separacao_qtd,
    COALESCE(qual.qtd, 0)::bigint as qualidade_qtd,
    COALESCE(pint.m2, 0)::numeric as pintura_m2,
    COALESCE(car.qtd, 0)::bigint as carregamento_qtd
  FROM datas d
  LEFT JOIN solda_stats ss ON ss.dia = d.dia
  LEFT JOIN perfiladeira_stats ps ON ps.dia = d.dia
  LEFT JOIN separacao_stats sep ON sep.dia = d.dia
  LEFT JOIN qualidade_stats qual ON qual.dia = d.dia
  LEFT JOIN pintura_stats pint ON pint.dia = d.dia
  LEFT JOIN carregamento_stats car ON car.dia = d.dia
  ORDER BY d.dia;
END;
$$;