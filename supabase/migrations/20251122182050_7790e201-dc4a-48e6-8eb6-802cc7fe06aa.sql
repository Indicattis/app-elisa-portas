-- Create unified materials ranking function that returns both quantity and meterage
CREATE OR REPLACE FUNCTION public.get_materiais_ranking_completo()
RETURNS TABLE(
  item text,
  total_quantidade numeric,
  metragem_m2 numeric,
  ocorrencias bigint
)
LANGUAGE sql
STABLE
AS $function$
  SELECT 
    lo.item,
    SUM(lo.quantidade) as total_quantidade,
    SUM(
      CASE 
        WHEN lo.largura IS NOT NULL AND lo.altura IS NOT NULL 
        THEN lo.largura * lo.altura * lo.quantidade / 1000000
        ELSE 0
      END
    ) as metragem_m2,
    COUNT(*) as ocorrencias
  FROM linhas_ordens lo
  WHERE lo.concluida = true
    AND lo.concluida_em >= CURRENT_DATE
  GROUP BY lo.item
  ORDER BY total_quantidade DESC;
$function$;