-- Criar tabela vendas_catalogo para produtos comercializáveis
CREATE TABLE vendas_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_produto text NOT NULL,
  descricao_produto text,
  categoria text DEFAULT 'geral',
  subcategoria_id uuid REFERENCES estoque_subcategorias(id),
  quantidade integer NOT NULL DEFAULT 0,
  unidade text DEFAULT 'UN',
  preco_venda numeric NOT NULL DEFAULT 0,
  custo_produto numeric DEFAULT 0,
  ativo boolean DEFAULT true,
  imagem_url text,
  peso numeric,
  destaque boolean DEFAULT false,
  estoque_minimo integer DEFAULT 0,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(user_id)
);

-- Índices para performance
CREATE INDEX idx_vendas_catalogo_ativo ON vendas_catalogo(ativo);
CREATE INDEX idx_vendas_catalogo_categoria ON vendas_catalogo(categoria);
CREATE INDEX idx_vendas_catalogo_destaque ON vendas_catalogo(destaque);
CREATE INDEX idx_vendas_catalogo_nome ON vendas_catalogo(nome_produto);

-- RLS Policies
ALTER TABLE vendas_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vendas_catalogo"
  ON vendas_catalogo FOR SELECT
  TO authenticated
  USING (ativo = true);

CREATE POLICY "Authenticated users can manage vendas_catalogo"
  ON vendas_catalogo FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_vendas_catalogo_updated_at
  BEFORE UPDATE ON vendas_catalogo
  FOR EACH ROW
  EXECUTE FUNCTION update_estoque_updated_at();

-- Adicionar coluna vendas_catalogo_id na tabela produtos_vendas
ALTER TABLE produtos_vendas 
ADD COLUMN vendas_catalogo_id uuid REFERENCES vendas_catalogo(id);

CREATE INDEX idx_produtos_vendas_catalogo ON produtos_vendas(vendas_catalogo_id);

-- Comentário na tabela
COMMENT ON TABLE vendas_catalogo IS 'Catálogo de produtos para vendas avulsas (separado do estoque de produção)';

-- Migrar produtos comercializáveis do estoque para o catálogo
INSERT INTO vendas_catalogo (
  nome_produto,
  descricao_produto,
  categoria,
  subcategoria_id,
  quantidade,
  unidade,
  preco_venda,
  custo_produto,
  ativo,
  peso,
  created_by
)
SELECT 
  nome_produto,
  descricao_produto,
  categoria,
  subcategoria_id,
  quantidade,
  unidade,
  preco_unitario as preco_venda,
  0 as custo_produto,
  ativo,
  peso_porta as peso,
  created_by
FROM estoque
WHERE comercializado_individualmente = true AND ativo = true;