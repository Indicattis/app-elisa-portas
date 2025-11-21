-- Criar tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT 'ELISA PORTAS E ACESSÓRIOS LTDA',
  cnpj TEXT NOT NULL DEFAULT '00.000.000/0001-00',
  endereco TEXT NOT NULL DEFAULT 'Endereço da empresa',
  cidade TEXT NOT NULL DEFAULT 'Cidade - Estado',
  cep TEXT NOT NULL DEFAULT '00000-000',
  telefone TEXT,
  email TEXT,
  site TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configuração inicial se não existir
INSERT INTO company_settings (nome, cnpj, endereco, cidade, cep)
SELECT 
  'ELISA PORTAS E ACESSÓRIOS LTDA',
  '00.000.000/0001-00',
  'Endereço da empresa',
  'Cidade - Estado',
  '00000-000'
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);

-- Habilitar RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policy para visualização (todos autenticados)
CREATE POLICY "Authenticated users can view company_settings"
  ON company_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy para atualização (apenas admins)
CREATE POLICY "Only admins can update company_settings"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());