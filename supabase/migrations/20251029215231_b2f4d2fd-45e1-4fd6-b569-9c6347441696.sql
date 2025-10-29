-- Migração para popular largura e altura dos registros existentes
-- que possuem tamanho no formato "X,XXxY,YY"

UPDATE produtos_vendas
SET 
  largura = CAST(REPLACE(SPLIT_PART(tamanho, 'x', 1), ',', '.') AS NUMERIC),
  altura = CAST(REPLACE(SPLIT_PART(tamanho, 'x', 2), ',', '.') AS NUMERIC)
WHERE 
  tamanho IS NOT NULL 
  AND tamanho LIKE '%x%'
  AND largura IS NULL 
  AND altura IS NULL;