-- Remove a constraint única apenas no mês
ALTER TABLE marketing_investimentos DROP CONSTRAINT marketing_investimentos_mes_key;

-- Cria uma constraint única composta de mês e região para permitir múltiplas entradas por mês
CREATE UNIQUE INDEX marketing_investimentos_mes_regiao_key 
ON marketing_investimentos (mes, COALESCE(regiao, 'null'));