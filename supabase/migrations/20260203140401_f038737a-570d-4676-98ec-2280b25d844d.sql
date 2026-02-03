-- Calcular e atualizar metragem da ordem OPE-2026-0038 que já foi concluída
WITH metragem AS (
  SELECT 
    SUM(
      (CAST(REPLACE(COALESCE(tamanho, '0'), ',', '.') AS NUMERIC)) 
      * COALESCE(quantidade, 1)
    ) as total
  FROM linhas_ordens 
  WHERE ordem_id = '95f9bcf5-b030-4b00-aea2-e64c2447e209'
)
UPDATE ordens_perfiladeira 
SET metragem_linear = (SELECT total FROM metragem)
WHERE id = '95f9bcf5-b030-4b00-aea2-e64c2447e209';