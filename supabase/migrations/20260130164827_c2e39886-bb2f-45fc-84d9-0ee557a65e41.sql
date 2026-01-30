-- Adicionar novos campos para suportar fluxo de pausar/retomar
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS status text DEFAULT 'em_andamento';
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS iniciada_em timestamptz DEFAULT now();
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS concluida_em timestamptz;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS tempo_total_segundos integer DEFAULT 0;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS pausada boolean DEFAULT false;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS tempo_acumulado_segundos integer DEFAULT 0;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS pausada_em timestamptz;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS total_itens integer DEFAULT 0;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS itens_conferidos integer DEFAULT 0;

-- Policies para UPDATE
CREATE POLICY "Usuarios autenticados podem atualizar conferencias" 
ON estoque_conferencias FOR UPDATE TO authenticated 
USING (true);

CREATE POLICY "Usuarios autenticados podem atualizar itens" 
ON estoque_conferencia_itens FOR UPDATE TO authenticated 
USING (true);