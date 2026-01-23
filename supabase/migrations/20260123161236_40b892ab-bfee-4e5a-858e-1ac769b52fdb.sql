-- Inserir as linhas para a ordem OPE-2026-0031 com todos os campos obrigatórios
INSERT INTO linhas_ordens (pedido_id, ordem_id, pedido_linha_id, tipo_ordem, item, quantidade, tamanho, estoque_id, indice_porta, concluida)
SELECT 
  pl.pedido_id,
  '3aa2ff1a-ee91-49ea-8271-171ec62e731d',
  pl.id,
  'perfiladeira',
  pl.nome_produto,
  pl.quantidade,
  pl.tamanho,
  pl.estoque_id,
  pl.indice_porta,
  false
FROM pedido_linhas pl
WHERE pl.pedido_id = '5ee4873b-caf7-4be8-b00e-acca2e00f55d'
AND pl.tipo_ordem = 'perfiladeira';