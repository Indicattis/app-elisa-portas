-- Criar função para contar portas concluídas por etapa hoje
CREATE OR REPLACE FUNCTION public.get_portas_por_etapa_hoje()
RETURNS TABLE(
  portas_perfiladas integer,
  portas_soldadas integer,
  portas_separadas integer
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
    ) as portas_separadas;
END;
$$;