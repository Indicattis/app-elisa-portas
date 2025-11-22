-- Função para contar portas de enrolar produzidas no mês atual
CREATE OR REPLACE FUNCTION get_portas_enrolar_produzidas_mes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(quantidade), 0)::INTEGER
    FROM linhas_ordens
    WHERE item = 'Porta de Enrolar'
    AND concluida = true
    AND DATE_TRUNC('month', concluida_em) = DATE_TRUNC('month', CURRENT_DATE)
  );
END;
$$;

-- Função para contar meta de produção do mês (pedidos com entrega prevista para o mês)
CREATE OR REPLACE FUNCTION get_meta_producao_mes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT p.id)::INTEGER
    FROM pedidos_producao p
    INNER JOIN vendas v ON p.venda_id = v.id
    WHERE DATE_TRUNC('month', v.data_entrega) = DATE_TRUNC('month', CURRENT_DATE)
  );
END;
$$;

-- Função para contar pedidos na fila (a serem digitados)
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
    WHERE status = 'aguardando_digitacao'
  );
END;
$$;

-- Função para contar ordens paradas (sem responsável)
CREATE OR REPLACE FUNCTION get_ordens_paradas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paradas INTEGER := 0;
BEGIN
  -- Ordens de soldagem sem captura
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_soldagem
  WHERE capturada = false
  AND status != 'concluido';
  
  -- Ordens de perfiladeira sem captura
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_perfiladeira
  WHERE capturada = false
  AND status != 'concluido';
  
  -- Ordens de separação sem captura
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_separacao
  WHERE capturada = false
  AND status != 'concluido';
  
  -- Ordens de qualidade sem captura
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_qualidade
  WHERE capturada = false
  AND status != 'concluido';
  
  -- Ordens de pintura sem captura
  SELECT total_paradas + COUNT(*)::INTEGER INTO total_paradas
  FROM ordens_pintura
  WHERE capturada = false
  AND status != 'pronta';
  
  RETURN total_paradas;
END;
$$;

-- Função para listar cores pintadas hoje
CREATE OR REPLACE FUNCTION get_cores_pintadas_hoje()
RETURNS TABLE (
  cor_nome TEXT,
  quantidade_pecas INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lo.cor_nome,
    COUNT(*)::INTEGER as quantidade_pecas
  FROM linhas_ordens lo
  WHERE lo.tipo_ordem = 'pintura'
  AND lo.concluida = true
  AND DATE(lo.concluida_em) = CURRENT_DATE
  AND lo.cor_nome IS NOT NULL
  GROUP BY lo.cor_nome
  ORDER BY quantidade_pecas DESC;
END;
$$;