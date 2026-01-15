-- Drop função existente e recriar com novo retorno
DROP FUNCTION IF EXISTS public.get_portas_por_etapa_hoje();

CREATE OR REPLACE FUNCTION public.get_portas_por_etapa_hoje()
RETURNS TABLE(
  portas_perfiladas integer,
  portas_soldadas integer,
  portas_separadas integer,
  metragem_perfilada numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT CONCAT(lo.produto_venda_id, '-', COALESCE(lo.indice_porta, 0)))::integer
     FROM linhas_ordens lo
     WHERE lo.tipo_ordem = 'perfiladeira' 
       AND lo.concluida = true
       AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ) as portas_perfiladas,
    
    (SELECT COUNT(DISTINCT CONCAT(lo.produto_venda_id, '-', COALESCE(lo.indice_porta, 0)))::integer
     FROM linhas_ordens lo
     WHERE lo.tipo_ordem = 'soldagem' 
       AND lo.concluida = true
       AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ) as portas_soldadas,
    
    (SELECT COUNT(DISTINCT CONCAT(lo.produto_venda_id, '-', COALESCE(lo.indice_porta, 0)))::integer
     FROM linhas_ordens lo
     WHERE lo.tipo_ordem = 'separacao' 
       AND lo.concluida = true
       AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ) as portas_separadas,
    
    -- Metragem perfilada: soma dos tamanhos das linhas de perfiladeira concluídas hoje
    (SELECT COALESCE(SUM(
      CASE 
        WHEN lo.tamanho IS NOT NULL AND lo.tamanho != '' THEN 
          CAST(REPLACE(lo.tamanho, ',', '.') AS numeric) * lo.quantidade
        ELSE 0
      END
    ), 0)::numeric
     FROM linhas_ordens lo
     WHERE lo.tipo_ordem = 'perfiladeira' 
       AND lo.concluida = true
       AND DATE(lo.concluida_em AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ) as metragem_perfilada;
END;
$$;