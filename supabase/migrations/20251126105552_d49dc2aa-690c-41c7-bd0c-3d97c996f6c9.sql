-- Atualizar função para contar portas produzidas hoje
-- Considera pedidos com status 'concluido' ou 'arquivado' finalizados hoje
-- Conta a quantidade de itens (portas) nas linhas dos pedidos

CREATE OR REPLACE FUNCTION public.get_portas_enrolar_produzidas_hoje()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_portas integer;
BEGIN
  SELECT COALESCE(SUM(pl.quantidade), 0)::integer
  INTO total_portas
  FROM pedidos_producao pp
  INNER JOIN pedido_linhas pl ON pl.pedido_id = pp.id
  WHERE pp.status IN ('concluido', 'arquivado')
    AND DATE(pp.updated_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo');
  
  RETURN total_portas;
END;
$$;