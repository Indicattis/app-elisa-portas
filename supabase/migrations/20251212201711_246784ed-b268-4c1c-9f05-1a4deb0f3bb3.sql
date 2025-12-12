-- Recriar tabelas de custos (caso não existam)
CREATE TABLE IF NOT EXISTS public.custos_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#3B82F6',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custos_subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES public.custos_categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tipos_custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.custos_categorias(id),
  subcategoria_id UUID REFERENCES public.custos_subcategorias(id),
  valor_maximo_mensal NUMERIC NOT NULL DEFAULT 0,
  recorrente BOOLEAN DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (se já não estiver habilitado)
ALTER TABLE public.custos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_custos ENABLE ROW LEVEL SECURITY;

-- RLS Policies (ignorar se já existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custos_categorias' AND policyname = 'Authenticated users can manage custos_categorias') THEN
    CREATE POLICY "Authenticated users can manage custos_categorias"
      ON public.custos_categorias FOR ALL
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'custos_subcategorias' AND policyname = 'Authenticated users can manage custos_subcategorias') THEN
    CREATE POLICY "Authenticated users can manage custos_subcategorias"
      ON public.custos_subcategorias FOR ALL
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tipos_custos' AND policyname = 'Authenticated users can manage tipos_custos') THEN
    CREATE POLICY "Authenticated users can manage tipos_custos"
      ON public.tipos_custos FOR ALL
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Inserir tipos de custos
INSERT INTO public.tipos_custos (nome, valor_maximo_mensal, recorrente, ativo) VALUES
  ('Aluguel', 0, true, true),
  ('Internet', 0, true, true),
  ('Telefonia - CDL', 0, true, true),
  ('Energia', 0, true, true),
  ('Água', 0, true, true),
  ('Frota - Seguros - Rastreadores - IPVA', 0, true, true),
  ('Marketing - Publicidade', 0, true, true),
  ('Contabilidade', 0, true, true),
  ('Softwares', 0, true, true),
  ('Consultoria jurídica', 0, true, true),
  ('Segurança Patrimonial', 0, true, true),
  ('Insumos', 0, true, true),
  ('Seguro Empresa', 0, true, true);