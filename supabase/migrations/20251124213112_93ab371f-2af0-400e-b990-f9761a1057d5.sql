-- Recriar tabela instalacoes com estrutura correta
CREATE TABLE IF NOT EXISTS instalacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos_producao(id) ON DELETE SET NULL,
  venda_id UUID REFERENCES vendas(id) ON DELETE SET NULL,
  nome_cliente TEXT NOT NULL,
  data_instalacao DATE,
  hora TEXT NOT NULL DEFAULT '08:00',
  tipo_instalacao TEXT CHECK (tipo_instalacao IN ('elisa', 'autorizados')),
  responsavel_instalacao_id UUID,
  responsavel_instalacao_nome TEXT,
  status TEXT NOT NULL DEFAULT 'pendente_producao' CHECK (status IN ('pendente_producao', 'pronta_fabrica', 'finalizada')),
  instalacao_concluida BOOLEAN NOT NULL DEFAULT FALSE,
  instalacao_concluida_em TIMESTAMP WITH TIME ZONE,
  instalacao_concluida_por UUID,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geocode_precision TEXT,
  last_geocoded_at TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Habilitar RLS
ALTER TABLE instalacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view instalacoes"
  ON instalacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert instalacoes"
  ON instalacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update instalacoes"
  ON instalacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete instalacoes"
  ON instalacoes FOR DELETE
  TO authenticated
  USING (is_admin());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_instalacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_instalacoes_updated_at
  BEFORE UPDATE ON instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_instalacoes_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_instalacoes_pedido_id ON instalacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_instalacoes_venda_id ON instalacoes(venda_id);
CREATE INDEX IF NOT EXISTS idx_instalacoes_data_instalacao ON instalacoes(data_instalacao);
CREATE INDEX IF NOT EXISTS idx_instalacoes_status ON instalacoes(status);
CREATE INDEX IF NOT EXISTS idx_instalacoes_responsavel_id ON instalacoes(responsavel_instalacao_id);