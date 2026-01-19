-- Atualizar campo tamanho nas linhas_ordens existentes que estão com valor nulo
UPDATE linhas_ordens lo
SET tamanho = pl.tamanho
FROM pedido_linhas pl
WHERE lo.pedido_linha_id = pl.id
  AND lo.tamanho IS NULL
  AND pl.tamanho IS NOT NULL;