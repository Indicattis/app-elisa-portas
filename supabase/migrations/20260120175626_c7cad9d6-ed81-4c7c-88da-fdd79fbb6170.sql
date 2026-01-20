-- Popular linhas para ordens de pintura existentes, ignorando duplicatas
INSERT INTO linhas_ordens (
  ordem_id, 
  pedido_id, 
  tipo_ordem, 
  item, 
  quantidade, 
  tamanho, 
  concluida, 
  produto_venda_id, 
  cor_nome, 
  tipo_pintura, 
  largura, 
  altura, 
  estoque_id, 
  pedido_linha_id
)
SELECT 
  op.id as ordem_id,
  pl.pedido_id,
  'pintura' as tipo_ordem,
  COALESCE(pl.nome_produto, pl.descricao_produto, e.nome_produto, 'Item') as item,
  COALESCE(pl.quantidade, 1) as quantidade,
  COALESCE(pl.tamanho, pl.largura::text || ' x ' || pl.altura::text) as tamanho,
  false as concluida,
  pl.produto_venda_id,
  cc.nome as cor_nome,
  pv.tipo_pintura,
  pl.largura,
  pl.altura,
  pl.estoque_id,
  pl.id as pedido_linha_id
FROM ordens_pintura op
JOIN pedido_linhas pl ON pl.pedido_id = op.pedido_id
LEFT JOIN estoque e ON pl.estoque_id = e.id
LEFT JOIN produtos_vendas pv ON pl.produto_venda_id = pv.id
LEFT JOIN catalogo_cores cc ON pv.cor_id = cc.id
WHERE op.historico = false
  AND (e.requer_pintura = true OR e.requer_pintura IS NULL)
ON CONFLICT (pedido_linha_id) WHERE pedido_linha_id IS NOT NULL DO NOTHING;