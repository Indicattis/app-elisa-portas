CREATE TABLE public.metas_instalacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('equipe', 'gerente')),
  referencia_id uuid NOT NULL,
  quantidade_portas integer NOT NULL,
  data_inicio date NOT NULL,
  data_termino date NOT NULL,
  concluida boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.metas_instalacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select" ON public.metas_instalacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.metas_instalacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON public.metas_instalacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON public.metas_instalacao FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_metas_instalacao_updated_at
BEFORE UPDATE ON public.metas_instalacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();