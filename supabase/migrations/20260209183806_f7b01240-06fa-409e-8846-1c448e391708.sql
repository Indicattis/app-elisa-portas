CREATE TABLE public.autorizado_cidades_secundarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id uuid NOT NULL REFERENCES public.autorizados(id) ON DELETE CASCADE,
  cidade text NOT NULL,
  estado text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(autorizado_id, cidade, estado)
);

ALTER TABLE public.autorizado_cidades_secundarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cidades secundarias"
  ON public.autorizado_cidades_secundarias
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);