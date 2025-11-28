-- Dropar função existente
DROP FUNCTION IF EXISTS get_materiais_ranking_completo();

-- Recriar função para buscar ranking completo de materiais (quantidade + metragem)
CREATE FUNCTION get_materiais_ranking_completo()
RETURNS TABLE (
  item TEXT,
  total_quantidade NUMERIC,
  metragem_m2 NUMERIC,
  ocorrencias BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    lo.item,
    SUM(lo.quantidade) as total_quantidade,
    COALESCE(
      SUM(
        CASE 
          WHEN lo.largura IS NOT NULL AND lo.altura IS NOT NULL 
          THEN (lo.largura / 1000.0) * (lo.altura / 1000.0) * lo.quantidade
          ELSE 0 
        END
      ), 
      0
    ) as metragem_m2,
    COUNT(*) as ocorrencias
  FROM linhas_ordens lo
  WHERE lo.concluida = true
    AND lo.concluida_em >= CURRENT_DATE
  GROUP BY lo.item
  ORDER BY total_quantidade DESC, metragem_m2 DESC
  LIMIT 20;
$$;

COMMENT ON FUNCTION get_materiais_ranking_completo() IS 
  'Retorna ranking de materiais produzidos hoje com quantidade e metragem';