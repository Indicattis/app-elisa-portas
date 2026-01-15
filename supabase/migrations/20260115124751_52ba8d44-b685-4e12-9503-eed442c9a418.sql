-- Atualizar o campo 'item' em linhas_ordens com o nome atual do estoque
-- Isso corrige todas as linhas que têm um estoque_id vinculado mas com nome desatualizado
UPDATE linhas_ordens lo
SET item = e.nome_produto
FROM estoque e
WHERE lo.estoque_id = e.id
  AND lo.estoque_id IS NOT NULL
  AND lo.item IS DISTINCT FROM e.nome_produto;