-- Criar tabela de templates de contratos
CREATE TABLE contratos_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Criar tabela de contratos de vendas
CREATE TABLE contratos_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contratos_templates(id),
  arquivo_url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho_arquivo INTEGER NOT NULL,
  status TEXT DEFAULT 'pendente_assinatura',
  observacoes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE contratos_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_vendas ENABLE ROW LEVEL SECURITY;

-- Policies para contratos_templates
CREATE POLICY "Authenticated users can view templates"
  ON contratos_templates FOR SELECT
  USING (ativo = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage templates"
  ON contratos_templates FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies para contratos_vendas
CREATE POLICY "Authenticated users can view contratos"
  ON contratos_vendas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create contratos"
  ON contratos_vendas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contratos"
  ON contratos_vendas FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete contratos"
  ON contratos_vendas FOR DELETE
  USING (is_admin());

-- Criar bucket para contratos de vendas
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-vendas', 'contratos-vendas', false);

-- RLS Policies para o bucket
CREATE POLICY "Authenticated users can upload contratos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contratos-vendas' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view contratos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contratos-vendas' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contratos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'contratos-vendas' AND auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX idx_contratos_vendas_venda_id ON contratos_vendas(venda_id);
CREATE INDEX idx_contratos_vendas_template_id ON contratos_vendas(template_id);
CREATE INDEX idx_contratos_templates_ativo ON contratos_templates(ativo);
CREATE INDEX idx_contratos_templates_ordem ON contratos_templates(ordem);