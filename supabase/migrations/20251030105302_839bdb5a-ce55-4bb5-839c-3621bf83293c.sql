-- Adicionar coluna categoria_linha na tabela pedido_linhas
ALTER TABLE pedido_linhas 
ADD COLUMN categoria_linha text NOT NULL DEFAULT 'separacao' 
CHECK (categoria_linha IN ('separacao', 'solda', 'perfiladeira'));

-- Criar índice para melhor performance
CREATE INDEX idx_pedido_linhas_categoria ON pedido_linhas(categoria_linha);

-- Popular automaticamente acessórios e adicionais como linhas de separação para pedidos existentes
INSERT INTO pedido_linhas (
  pedido_id,
  nome_produto,
  descricao_produto,
  quantidade,
  categoria_linha,
  ordem,
  check_separacao,
  check_qualidade,
  check_coleta
)
SELECT DISTINCT ON (pp.id, pv.descricao)
  pp.id as pedido_id,
  pv.descricao as nome_produto,
  pv.descricao as descricao_produto,
  pv.quantidade,
  'separacao' as categoria_linha,
  COALESCE((SELECT MAX(ordem) FROM pedido_linhas WHERE pedido_id = pp.id), 0) + 
    ROW_NUMBER() OVER (PARTITION BY pp.id ORDER BY pv.created_at) as ordem,
  false as check_separacao,
  false as check_qualidade,
  false as check_coleta
FROM pedidos_producao pp
INNER JOIN vendas v ON v.id = pp.venda_id
INNER JOIN produtos_vendas pv ON pv.venda_id = v.id
WHERE pv.tipo_produto IN ('acessorio', 'adicional')
AND NOT EXISTS (
  SELECT 1 FROM pedido_linhas pl 
  WHERE pl.pedido_id = pp.id 
  AND pl.nome_produto = pv.descricao
  AND pl.quantidade = pv.quantidade
)
ORDER BY pp.id, pv.descricao, pv.created_at;