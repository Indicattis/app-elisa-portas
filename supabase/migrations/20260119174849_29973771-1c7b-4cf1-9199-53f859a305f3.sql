-- Inserir linhas faltantes para ordens de perfiladeira
INSERT INTO linhas_ordens (
  ordem_id, pedido_id, tipo_ordem, item, quantidade, 
  tamanho, concluida, produto_venda_id, largura, altura, 
  pedido_linha_id, estoque_id
)
SELECT 
  op.id as ordem_id,
  pl.pedido_id,
  'perfiladeira' as tipo_ordem,
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item') as item,
  COALESCE(pl.quantidade, 1) as quantidade,
  pl.tamanho,
  false as concluida,
  pl.produto_venda_id,
  pl.largura,
  pl.altura,
  pl.id as pedido_linha_id,
  pl.estoque_id
FROM ordens_perfiladeira op
JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
WHERE pl.categoria_linha = 'perfiladeira'
  AND NOT EXISTS (
    SELECT 1 FROM linhas_ordens lo 
    WHERE lo.pedido_linha_id = pl.id
  );