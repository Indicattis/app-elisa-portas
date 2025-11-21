-- Criar tabela depositos_caixa
CREATE TABLE depositos_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_deposito DATE NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL CHECK (categoria IN ('giro_caixa', 'travesseiro', 'precaucoes')),
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE depositos_caixa ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view depositos_caixa"
  ON depositos_caixa FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert depositos_caixa"
  ON depositos_caixa FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update depositos_caixa"
  ON depositos_caixa FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete depositos_caixa"
  ON depositos_caixa FOR DELETE
  USING (is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_depositos_caixa_updated_at
  BEFORE UPDATE ON depositos_caixa
  FOR EACH ROW
  EXECUTE FUNCTION update_estoque_updated_at();

-- Índices para performance
CREATE INDEX idx_depositos_caixa_data ON depositos_caixa(data_deposito);
CREATE INDEX idx_depositos_caixa_categoria ON depositos_caixa(categoria);

-- Adicionar rota na sidebar
INSERT INTO app_routes (key, path, label, description, icon, interface, parent_key, sort_order, active)
VALUES (
  'financeiro_caixa',
  '/dashboard/administrativo/financeiro/caixa',
  'Gestão de Caixa',
  'Controle de depósitos e movimentações financeiras',
  'Wallet',
  'admin',
  'financeiro_home',
  40,
  true
);