-- Inserir linhas faltantes para o pedido 0087
-- Pedido ID: 0d4acc35-162e-44cf-b2f5-19fa3fc66755

-- Inserir linhas para SOLDAGEM (ordem 656d1d2b-ce6e-45e8-aad6-892cb104ff01)
INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id)
SELECT 
  '656d1d2b-ce6e-45e8-aad6-892cb104ff01'::uuid,
  pl.pedido_id, 
  'soldagem', 
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1), 
  pl.tamanho, 
  false, 
  pl.produto_venda_id, 
  pl.largura, 
  pl.altura, 
  pl.id, 
  pl.estoque_id
FROM pedido_linhas pl
WHERE pl.pedido_id = '0d4acc35-162e-44cf-b2f5-19fa3fc66755'::uuid 
  AND pl.categoria_linha = 'solda'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'soldagem'
  );

-- Inserir linhas para PERFILADEIRA (ordem 6635a342-7179-4206-82db-be770f851ede)
INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id)
SELECT 
  '6635a342-7179-4206-82db-be770f851ede'::uuid,
  pl.pedido_id, 
  'perfiladeira', 
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1), 
  pl.tamanho, 
  false, 
  pl.produto_venda_id, 
  pl.largura, 
  pl.altura, 
  pl.id, 
  pl.estoque_id
FROM pedido_linhas pl
WHERE pl.pedido_id = '0d4acc35-162e-44cf-b2f5-19fa3fc66755'::uuid 
  AND pl.categoria_linha = 'perfiladeira'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'perfiladeira'
  );

-- Inserir linhas para SEPARAÇÃO (ordem 6e0aec3c-1d94-49b1-a3df-143ccd14d9df)
INSERT INTO linhas_ordens (ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id)
SELECT 
  '6e0aec3c-1d94-49b1-a3df-143ccd14d9df'::uuid,
  pl.pedido_id, 
  'separacao', 
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1), 
  pl.tamanho, 
  false, 
  pl.produto_venda_id, 
  pl.largura, 
  pl.altura, 
  pl.id, 
  pl.estoque_id
FROM pedido_linhas pl
WHERE pl.pedido_id = '0d4acc35-162e-44cf-b2f5-19fa3fc66755'::uuid 
  AND pl.categoria_linha = 'separacao'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'separacao'
  );