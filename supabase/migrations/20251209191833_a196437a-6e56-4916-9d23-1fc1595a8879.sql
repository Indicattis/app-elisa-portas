-- Atualizar produtos_vendas com largura e altura extraídas do campo tamanho
-- Apenas para produtos do tipo porta_enrolar e pintura_epoxi que têm tamanho no formato "LxA"
UPDATE produtos_vendas
SET 
  largura = CAST(
    REPLACE(
      REGEXP_REPLACE(tamanho, '^([\d,\.]+)\s*[xX]\s*[\d,\.]+$', '\1'),
      ',', '.'
    ) AS NUMERIC
  ),
  altura = CAST(
    REPLACE(
      REGEXP_REPLACE(tamanho, '^[\d,\.]+\s*[xX]\s*([\d,\.]+)$', '\1'),
      ',', '.'
    ) AS NUMERIC
  )
WHERE 
  tipo_produto IN ('porta_enrolar', 'pintura_epoxi')
  AND (largura IS NULL OR altura IS NULL)
  AND tamanho IS NOT NULL
  AND tamanho ~ '^[\d,\.]+\s*[xX]\s*[\d,\.]+$';