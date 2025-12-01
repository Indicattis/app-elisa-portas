-- Create table for issuing companies
CREATE TABLE empresas_emissoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic data
  nome TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  
  -- Address
  endereco TEXT NOT NULL,
  numero TEXT,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT NOT NULL,
  
  -- Contact
  telefone TEXT,
  email TEXT,
  
  -- Fiscal data
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  cnae TEXT,
  codigo_municipio_ibge TEXT,
  
  -- NFS-e settings
  codigo_servico_padrao TEXT,
  descricao_servico_padrao TEXT,
  aliquota_iss_padrao NUMERIC DEFAULT 5,
  
  -- Numbering
  serie_nfe INTEGER DEFAULT 1,
  serie_nfse INTEGER DEFAULT 1,
  
  -- Focus NFe API
  focusnfe_token TEXT,
  ambiente TEXT DEFAULT 'sandbox',
  email_copia TEXT,
  
  -- Control
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_empresas_emissoras_cnpj ON empresas_emissoras(cnpj);
CREATE INDEX idx_empresas_emissoras_ativo ON empresas_emissoras(ativo);
CREATE INDEX idx_empresas_emissoras_padrao ON empresas_emissoras(padrao);

-- RLS
ALTER TABLE empresas_emissoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage empresas_emissoras" ON empresas_emissoras
  FOR ALL USING (is_admin());

CREATE POLICY "Authenticated can view active empresas_emissoras" ON empresas_emissoras
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- Add empresa_emissora_id to notas_fiscais table
ALTER TABLE notas_fiscais 
ADD COLUMN empresa_emissora_id UUID REFERENCES empresas_emissoras(id);

-- Create index for the foreign key
CREATE INDEX idx_notas_fiscais_empresa_emissora ON notas_fiscais(empresa_emissora_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_empresas_emissoras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_empresas_emissoras_updated_at
  BEFORE UPDATE ON empresas_emissoras
  FOR EACH ROW
  EXECUTE FUNCTION update_empresas_emissoras_updated_at();