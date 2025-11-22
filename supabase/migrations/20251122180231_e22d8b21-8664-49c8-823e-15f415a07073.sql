-- Corrigir função de pedidos na fila
-- Pedidos na fila são aqueles que estão na etapa 'aberto' e com status 'pendente'
DROP FUNCTION IF EXISTS get_pedidos_na_fila();

CREATE OR REPLACE FUNCTION get_pedidos_na_fila()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM pedidos_producao
    WHERE etapa_atual = 'aberto' 
    AND status = 'pendente'
  );
END;
$$;

-- Corrigir função de ordens paradas
-- Ordens paradas são aquelas sem responsável (responsavel_id IS NULL)
DROP FUNCTION IF EXISTS get_ordens_paradas();

CREATE OR REPLACE FUNCTION get_ordens_paradas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paradas INTEGER := 0;
BEGIN
  -- Ordens de soldagem sem responsável
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_soldagem
  WHERE responsavel_id IS NULL
  AND status != 'concluido'
  AND historico = false;
  
  -- Ordens de perfiladeira sem responsável
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_perfiladeira
  WHERE responsavel_id IS NULL
  AND status != 'concluido'
  AND historico = false;
  
  -- Ordens de separação sem responsável
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_separacao
  WHERE responsavel_id IS NULL
  AND status != 'concluido'
  AND historico = false;
  
  -- Ordens de qualidade sem responsável
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_qualidade
  WHERE responsavel_id IS NULL
  AND status != 'concluido'
  AND historico = false;
  
  -- Ordens de pintura sem responsável
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_pintura
  WHERE responsavel_id IS NULL
  AND status != 'pronta'
  AND historico = false;
  
  RETURN total_paradas;
END;
$$;