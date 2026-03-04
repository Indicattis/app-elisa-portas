CREATE TABLE public.dre_custos_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto TEXT NOT NULL,
  custo NUMERIC DEFAULT 0,
  lucro NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dre_custos_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dre_custos_produtos"
  ON public.dre_custos_produtos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert dre_custos_produtos"
  ON public.dre_custos_produtos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update dre_custos_produtos"
  ON public.dre_custos_produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete dre_custos_produtos"
  ON public.dre_custos_produtos FOR DELETE TO authenticated USING (true);