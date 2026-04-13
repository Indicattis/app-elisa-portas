CREATE TABLE public.venda_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL,
  autor_nome text NOT NULL,
  comentario text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.venda_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage venda_comentarios"
  ON public.venda_comentarios FOR ALL TO authenticated USING (true) WITH CHECK (true);