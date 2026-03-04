
CREATE TABLE public.pedido_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL,
  autor_nome TEXT NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pedido_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pedido_comentarios"
  ON public.pedido_comentarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert pedido_comentarios"
  ON public.pedido_comentarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_pedido_comentarios_pedido_id ON public.pedido_comentarios(pedido_id);
