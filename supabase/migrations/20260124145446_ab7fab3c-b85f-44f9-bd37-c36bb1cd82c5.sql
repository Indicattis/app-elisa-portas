-- Criar tabela de frete por cidade
CREATE TABLE public.frete_cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado VARCHAR(2) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  valor_frete DECIMAL(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(estado, cidade)
);

-- Enable RLS
ALTER TABLE public.frete_cidades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read frete_cidades"
  ON public.frete_cidades FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert frete_cidades"
  ON public.frete_cidades FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update frete_cidades"
  ON public.frete_cidades FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete frete_cidades"
  ON public.frete_cidades FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_frete_cidades_updated_at
  BEFORE UPDATE ON public.frete_cidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();