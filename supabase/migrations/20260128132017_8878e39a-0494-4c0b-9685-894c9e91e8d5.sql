-- Corrigir linhas faltantes para o pedido 0093 (1b05ea5b-844b-418d-a5fa-7c4936d97f8b)
-- Este pedido foi retrocedido e avançado antes da correção do bug em 26/01

-- Inserir linhas para SOLDAGEM (ordem c575538b-12e9-4d07-8d80-800db3919f75)
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
  concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
)
SELECT 
  'c575538b-12e9-4d07-8d80-800db3919f75'::uuid,
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
WHERE pl.pedido_id = '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'::uuid 
  AND pl.categoria_linha = 'solda'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'soldagem'
  );

-- Inserir linhas para PERFILADEIRA (ordem d11a1ee0-9fff-4229-947f-e634e2c1533f)
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
  concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
)
SELECT 
  'd11a1ee0-9fff-4229-947f-e634e2c1533f'::uuid,
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
WHERE pl.pedido_id = '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'::uuid 
  AND pl.categoria_linha = 'perfiladeira'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'perfiladeira'
  );

-- Inserir linhas para SEPARACAO (ordem 5309297d-a58c-4ffa-aa46-3fd64efb47bd)
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, 
  concluida, produto_venda_id, largura, altura, pedido_linha_id, estoque_id
)
SELECT 
  '5309297d-a58c-4ffa-aa46-3fd64efb47bd'::uuid,
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
WHERE pl.pedido_id = '1b05ea5b-844b-418d-a5fa-7c4936d97f8b'::uuid 
  AND pl.categoria_linha = 'separacao'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id AND lo.tipo_ordem = 'separacao'
  );