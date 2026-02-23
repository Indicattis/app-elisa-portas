
CREATE TABLE custos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL,
  tipo_custo_id UUID NOT NULL REFERENCES tipos_custos(id) ON DELETE CASCADE,
  valor_real NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mes, tipo_custo_id)
);

ALTER TABLE custos_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver custos_mensais"
  ON custos_mensais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem inserir custos_mensais"
  ON custos_mensais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados podem atualizar custos_mensais"
  ON custos_mensais FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem deletar custos_mensais"
  ON custos_mensais FOR DELETE TO authenticated USING (true);
