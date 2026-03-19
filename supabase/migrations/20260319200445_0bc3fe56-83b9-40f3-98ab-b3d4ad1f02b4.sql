CREATE TABLE public.pedidos_pagos_sem_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT NOT NULL,
  estado TEXT NOT NULL,
  cidade TEXT NOT NULL,
  valor_pago NUMERIC(12,2) NOT NULL DEFAULT 0,
  portas_p INTEGER NOT NULL DEFAULT 0,
  portas_g INTEGER NOT NULL DEFAULT 0,
  portas_gg INTEGER NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.pedidos_pagos_sem_entrega ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage" ON public.pedidos_pagos_sem_entrega
  FOR ALL TO authenticated USING (true) WITH CHECK (true);