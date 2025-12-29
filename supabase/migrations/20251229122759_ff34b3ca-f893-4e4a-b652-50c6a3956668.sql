-- Adicionar colunas para sequencial mensal
ALTER TABLE pedidos_producao 
ADD COLUMN IF NOT EXISTS numero_mes integer,
ADD COLUMN IF NOT EXISTS mes_vigencia date;

-- Índice para otimizar busca do último número do mês
CREATE INDEX IF NOT EXISTS idx_pedidos_mes_vigencia ON pedidos_producao(mes_vigencia, numero_mes);

-- Função RPC para gerar próximo número mensal
CREATE OR REPLACE FUNCTION gerar_proximo_numero_mes()
RETURNS TABLE(numero integer, mes date) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mes_atual date;
  proximo_num integer;
BEGIN
  -- Primeiro dia do mês atual
  mes_atual := date_trunc('month', current_date)::date;
  
  -- Buscar último número do mês e incrementar
  SELECT COALESCE(MAX(p.numero_mes), 0) + 1 INTO proximo_num
  FROM pedidos_producao p
  WHERE p.mes_vigencia = mes_atual;
  
  RETURN QUERY SELECT proximo_num, mes_atual;
END;
$$;

-- Popular dados existentes com base no created_at
WITH numbered AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY date_trunc('month', created_at)
      ORDER BY created_at
    )::integer as num,
    date_trunc('month', created_at)::date as mes
  FROM pedidos_producao
  WHERE numero_mes IS NULL
)
UPDATE pedidos_producao p
SET 
  numero_mes = n.num,
  mes_vigencia = n.mes
FROM numbered n
WHERE p.id = n.id;