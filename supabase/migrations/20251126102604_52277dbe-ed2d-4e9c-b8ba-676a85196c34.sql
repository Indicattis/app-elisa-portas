DROP FUNCTION IF EXISTS get_materiais_ranking_completo();

CREATE OR REPLACE FUNCTION get_materiais_ranking_completo()
RETURNS TABLE (
  item TEXT,
  total_quantidade BIGINT,
  metragem_m2 NUMERIC,
  ocorrencias BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lo.item,
    SUM(lo.quantidade)::BIGINT as total_quantidade,
    SUM(
      CASE 
        WHEN lo.tamanho IS NOT NULL AND lo.tamanho != '' 
        THEN REPLACE(lo.tamanho, ',', '.')::NUMERIC * lo.quantidade
        ELSE 0
      END
    ) as metragem_m2,
    COUNT(*)::BIGINT as ocorrencias
  FROM linhas_ordens lo
  WHERE lo.concluida = true
    AND lo.concluida_em >= CURRENT_DATE
  GROUP BY lo.item
  ORDER BY total_quantidade DESC;
END;
$$;