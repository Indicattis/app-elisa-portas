
CREATE TABLE public.transportadoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage transportadoras"
  ON public.transportadoras FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.frete_transportadoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transportadora_id uuid NOT NULL REFERENCES public.transportadoras(id) ON DELETE CASCADE,
  estado char(2) NOT NULL,
  valor_porta_p numeric NOT NULL DEFAULT 0,
  valor_porta_g numeric NOT NULL DEFAULT 0,
  valor_porta_gg numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transportadora_id, estado)
);

ALTER TABLE public.frete_transportadoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage frete_transportadoras"
  ON public.frete_transportadoras FOR ALL TO authenticated USING (true) WITH CHECK (true);
