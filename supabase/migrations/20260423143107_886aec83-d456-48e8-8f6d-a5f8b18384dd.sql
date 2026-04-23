
CREATE TABLE IF NOT EXISTS public.metas_vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  periodo TEXT NOT NULL CHECK (periodo IN ('semanal','mensal')),
  escopo TEXT NOT NULL CHECK (escopo IN ('individual','global')),
  vendedor_id UUID NULL,
  data_inicio_vigencia DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim_vigencia DATE NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.metas_vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view metas_vendas"
  ON public.metas_vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert metas_vendas"
  ON public.metas_vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update metas_vendas"
  ON public.metas_vendas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete metas_vendas"
  ON public.metas_vendas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_metas_vendas_updated_at
  BEFORE UPDATE ON public.metas_vendas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.metas_vendas_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_id UUID NOT NULL REFERENCES public.metas_vendas(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 1,
  nome TEXT NOT NULL,
  valor_alvo NUMERIC NOT NULL DEFAULT 0,
  bonificacao_tipo TEXT NOT NULL DEFAULT 'fixo' CHECK (bonificacao_tipo IN ('fixo','percentual')),
  bonificacao_valor NUMERIC NOT NULL DEFAULT 0,
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metas_vendas_tiers_meta ON public.metas_vendas_tiers(meta_id);

ALTER TABLE public.metas_vendas_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view metas_vendas_tiers"
  ON public.metas_vendas_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert metas_vendas_tiers"
  ON public.metas_vendas_tiers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update metas_vendas_tiers"
  ON public.metas_vendas_tiers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete metas_vendas_tiers"
  ON public.metas_vendas_tiers FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_metas_vendas_tiers_updated_at
  BEFORE UPDATE ON public.metas_vendas_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_routes (key, label, path, interface, icon, "group", sort_order, active, description)
VALUES ('paineis_metas_vendas', 'Metas de Vendas', '/paineis/metas-vendas', 'paineis', 'Target', 'paineis', 60, true, 'Painel de progresso de metas de vendas com tiers')
ON CONFLICT (key) DO NOTHING;
