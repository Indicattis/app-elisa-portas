-- Adicionar campos de integração NFe.io na tabela notas_fiscais
ALTER TABLE notas_fiscais
ADD COLUMN IF NOT EXISTS ref_externa TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS nfeio_id TEXT,
ADD COLUMN IF NOT EXISTS protocolo_autorizacao TEXT,
ADD COLUMN IF NOT EXISTS status_sefaz TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT,
ADD COLUMN IF NOT EXISTS data_autorizacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS danfe_url TEXT,
ADD COLUMN IF NOT EXISTS xml_autorizado_url TEXT,
ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ambiente TEXT DEFAULT 'sandbox',
ADD COLUMN IF NOT EXISTS codigo_servico TEXT,
ADD COLUMN IF NOT EXISTS descricao_servico TEXT,
ADD COLUMN IF NOT EXISTS aliquota_iss NUMERIC,
ADD COLUMN IF NOT EXISTS valor_iss NUMERIC,
ADD COLUMN IF NOT EXISTS tomador_endereco TEXT,
ADD COLUMN IF NOT EXISTS tomador_numero TEXT,
ADD COLUMN IF NOT EXISTS tomador_bairro TEXT,
ADD COLUMN IF NOT EXISTS tomador_cidade TEXT,
ADD COLUMN IF NOT EXISTS tomador_uf TEXT,
ADD COLUMN IF NOT EXISTS tomador_cep TEXT;

-- Criar tabela de configurações fiscais
CREATE TABLE IF NOT EXISTS configuracoes_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario TEXT,
  codigo_municipio_ibge TEXT,
  serie_nfe INTEGER DEFAULT 1,
  serie_nfse INTEGER DEFAULT 1,
  aliquota_iss_padrao NUMERIC DEFAULT 5,
  codigo_servico_padrao TEXT,
  descricao_servico_padrao TEXT,
  cnae TEXT,
  ambiente TEXT DEFAULT 'sandbox',
  email_copia TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE configuracoes_fiscais ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam e editem configurações
CREATE POLICY "Authenticated users can view configuracoes_fiscais"
  ON configuracoes_fiscais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update configuracoes_fiscais"
  ON configuracoes_fiscais FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert configuracoes_fiscais"
  ON configuracoes_fiscais FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Inserir configuração padrão se não existir
INSERT INTO configuracoes_fiscais (
  inscricao_estadual,
  inscricao_municipal,
  regime_tributario,
  codigo_municipio_ibge,
  aliquota_iss_padrao,
  ambiente
) 
SELECT 
  '',
  '',
  'simples_nacional',
  '4305108',
  5,
  'sandbox'
WHERE NOT EXISTS (SELECT 1 FROM configuracoes_fiscais LIMIT 1);