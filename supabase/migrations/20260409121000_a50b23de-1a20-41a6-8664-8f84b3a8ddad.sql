
CREATE TABLE public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_custo_id UUID NOT NULL REFERENCES public.tipos_custos(id),
  descricao TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  responsavel_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage gastos"
  ON public.gastos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
