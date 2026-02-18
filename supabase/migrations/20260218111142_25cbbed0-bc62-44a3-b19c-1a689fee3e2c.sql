
-- Add new columns to correcoes table
ALTER TABLE public.correcoes ADD COLUMN IF NOT EXISTS custo_correcao numeric DEFAULT 0;
ALTER TABLE public.correcoes ADD COLUMN IF NOT EXISTS setor_causador text;
ALTER TABLE public.correcoes ADD COLUMN IF NOT EXISTS justificativa text;
ALTER TABLE public.correcoes ADD COLUMN IF NOT EXISTS etapa_causadora text;

-- Create correcao_linhas table
CREATE TABLE public.correcao_linhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correcao_id uuid NOT NULL REFERENCES public.correcoes(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  quantidade integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.correcao_linhas ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users (same as correcoes)
CREATE POLICY "Authenticated users can view correcao_linhas"
  ON public.correcao_linhas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert correcao_linhas"
  ON public.correcao_linhas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update correcao_linhas"
  ON public.correcao_linhas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete correcao_linhas"
  ON public.correcao_linhas FOR DELETE TO authenticated USING (true);
