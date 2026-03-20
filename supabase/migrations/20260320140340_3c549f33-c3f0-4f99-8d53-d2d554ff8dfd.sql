-- Tabela de missões
CREATE TABLE public.missoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  prazo date NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de checkboxes da missão
CREATE TABLE public.missao_checkboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  missao_id uuid REFERENCES public.missoes(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL,
  concluida boolean DEFAULT false,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS missoes
ALTER TABLE public.missoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read missoes"
  ON public.missoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert missoes"
  ON public.missoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update missoes"
  ON public.missoes FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete missoes"
  ON public.missoes FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS missao_checkboxes
ALTER TABLE public.missao_checkboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read missao_checkboxes"
  ON public.missao_checkboxes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert missao_checkboxes"
  ON public.missao_checkboxes FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.missoes WHERE id = missao_id AND created_by = auth.uid())
  );

CREATE POLICY "Authenticated users can update missao_checkboxes"
  ON public.missao_checkboxes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Creator can delete missao_checkboxes"
  ON public.missao_checkboxes FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.missoes WHERE id = missao_id AND created_by = auth.uid())
  );