-- Criar tabela de subcategorias
CREATE TABLE estoque_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES estoque_categorias(id) ON DELETE CASCADE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_estoque_subcategorias_categoria ON estoque_subcategorias(categoria_id) WHERE ativo = true;
CREATE INDEX idx_estoque_subcategorias_ordem ON estoque_subcategorias(ordem);

-- RLS Policies
ALTER TABLE estoque_subcategorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subcategorias"
  ON estoque_subcategorias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage subcategorias"
  ON estoque_subcategorias FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comentários
COMMENT ON TABLE estoque_subcategorias IS 'Subcategorias de produtos do estoque vinculadas às categorias principais';
COMMENT ON COLUMN estoque_subcategorias.categoria_id IS 'Categoria principal à qual esta subcategoria pertence';

-- Criar tipo enum para setores de produção
CREATE TYPE setor_producao AS ENUM (
  'perfiladeira',
  'solda',
  'separacao',
  'pintura'
);

COMMENT ON TYPE setor_producao IS 'Setores responsáveis pela produção dos produtos';

-- Adicionar colunas à tabela estoque
ALTER TABLE estoque 
ADD COLUMN subcategoria_id UUID REFERENCES estoque_subcategorias(id) ON DELETE SET NULL;

ALTER TABLE estoque 
ADD COLUMN peso_porta NUMERIC(10,2) CHECK (peso_porta IS NULL OR peso_porta >= 0);

ALTER TABLE estoque 
ADD COLUMN setor_responsavel_producao setor_producao;

-- Índices
CREATE INDEX idx_estoque_subcategoria ON estoque(subcategoria_id) WHERE subcategoria_id IS NOT NULL;
CREATE INDEX idx_estoque_setor_producao ON estoque(setor_responsavel_producao) WHERE setor_responsavel_producao IS NOT NULL;

-- Comentários
COMMENT ON COLUMN estoque.subcategoria_id IS 'Subcategoria específica do produto dentro da categoria principal';
COMMENT ON COLUMN estoque.peso_porta IS 'Peso de porta recomendado para este produto (em kg)';
COMMENT ON COLUMN estoque.setor_responsavel_producao IS 'Setor da produção responsável por este produto';