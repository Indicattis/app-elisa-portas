-- Remove a constraint única apenas no mês
DROP INDEX IF EXISTS marketing_investimentos_mes_key;

-- Cria uma constraint única composta de mês e região para permitir múltiplas entradas por mês
CREATE UNIQUE INDEX marketing_investimentos_mes_regiao_key 
ON marketing_investimentos (mes, COALESCE(regiao, 'null'));