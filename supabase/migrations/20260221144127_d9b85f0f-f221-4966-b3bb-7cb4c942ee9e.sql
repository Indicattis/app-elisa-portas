
CREATE TABLE public.multas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.multas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage multas"
  ON public.multas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_multas_updated_at
  BEFORE UPDATE ON public.multas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
