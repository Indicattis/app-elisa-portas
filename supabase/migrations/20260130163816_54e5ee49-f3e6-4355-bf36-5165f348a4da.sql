-- Tabela principal de conferências
CREATE TABLE estoque_conferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferido_por UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT
);

-- Tabela de itens conferidos
CREATE TABLE estoque_conferencia_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID NOT NULL REFERENCES estoque_conferencias(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES estoque(id),
  quantidade_anterior INTEGER NOT NULL,
  quantidade_conferida INTEGER NOT NULL,
  diferenca INTEGER GENERATED ALWAYS AS (quantidade_conferida - quantidade_anterior) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices para performance
CREATE INDEX idx_estoque_conferencia_itens_conferencia ON estoque_conferencia_itens(conferencia_id);
CREATE INDEX idx_estoque_conferencia_itens_produto ON estoque_conferencia_itens(produto_id);

-- RLS Policies
ALTER TABLE estoque_conferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_conferencia_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver conferencias" ON estoque_conferencias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem criar conferencias" ON estoque_conferencias
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem ver itens" ON estoque_conferencia_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem criar itens" ON estoque_conferencia_itens
  FOR INSERT TO authenticated WITH CHECK (true);