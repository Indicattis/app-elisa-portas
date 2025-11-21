-- Criar tabela instalacoes
CREATE TABLE IF NOT EXISTS public.instalacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_venda UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  nome_cliente TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  produto TEXT NOT NULL,
  estado TEXT NOT NULL,
  cidade TEXT NOT NULL,
  endereco TEXT,
  cep TEXT,
  descricao TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view instalacoes"
  ON public.instalacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert instalacoes"
  ON public.instalacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update instalacoes"
  ON public.instalacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete instalacoes"
  ON public.instalacoes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_instalacoes_data ON public.instalacoes(data);
CREATE INDEX IF NOT EXISTS idx_instalacoes_id_venda ON public.instalacoes(id_venda);
CREATE INDEX IF NOT EXISTS idx_instalacoes_created_by ON public.instalacoes(created_by);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_instalacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instalacoes_updated_at_trigger
  BEFORE UPDATE ON public.instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_instalacoes_updated_at();