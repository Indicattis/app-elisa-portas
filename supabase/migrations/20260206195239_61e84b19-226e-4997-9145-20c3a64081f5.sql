
-- Corrigir backfill de linhas de qualidade com dados de porta corretos
-- 1. Deletar linhas de qualidade existentes
DELETE FROM linhas_ordens
WHERE tipo_ordem = 'qualidade';

-- 2. Reinserir corretamente a partir de pedido_linhas
INSERT INTO linhas_ordens (
  pedido_id, ordem_id, tipo_ordem, item, quantidade,
  tamanho, concluida, estoque_id, produto_venda_id, indice_porta
)
SELECT
  oq.pedido_id,
  oq.id,
  'qualidade',
  COALESCE(pl.nome_produto, pl.descricao_produto, 'Item'),
  COALESCE(pl.quantidade, 1),
  COALESCE(pl.tamanho, pl.largura::text || ' x ' || pl.altura::text),
  false,
  pl.estoque_id,
  pl.produto_venda_id,
  pl.indice_porta
FROM ordens_qualidade oq
JOIN pedido_linhas pl ON pl.pedido_id = oq.pedido_id
  AND pl.categoria_linha IN ('solda', 'perfiladeira')
WHERE oq.historico = false;
