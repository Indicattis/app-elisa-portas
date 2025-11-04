-- Create despesas_mensais table
CREATE TABLE public.despesas_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes date NOT NULL,
  nome text NOT NULL,
  categoria text NOT NULL,
  modalidade text NOT NULL CHECK (modalidade IN ('fixa', 'variavel')),
  valor_esperado numeric NOT NULL DEFAULT 0,
  valor_real numeric NOT NULL DEFAULT 0,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(mes, nome, categoria)
);

-- Indexes for despesas_mensais
CREATE INDEX idx_despesas_mensais_mes ON public.despesas_mensais(mes);
CREATE INDEX idx_despesas_mensais_modalidade ON public.despesas_mensais(modalidade);

-- RLS Policies for despesas_mensais
ALTER TABLE public.despesas_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view despesas_mensais"
  ON public.despesas_mensais FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert despesas_mensais"
  ON public.despesas_mensais FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update despesas_mensais"
  ON public.despesas_mensais FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete despesas_mensais"
  ON public.despesas_mensais FOR DELETE
  USING (is_admin());

-- Create dre_mensais table
CREATE TABLE public.dre_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes date NOT NULL UNIQUE,
  faturamento_total numeric NOT NULL DEFAULT 0,
  custos_producao numeric NOT NULL DEFAULT 0,
  despesas_fixas numeric NOT NULL DEFAULT 0,
  despesas_variaveis numeric NOT NULL DEFAULT 0,
  resultado_final numeric NOT NULL DEFAULT 0,
  total_vendas integer NOT NULL DEFAULT 0,
  vendas_faturadas integer NOT NULL DEFAULT 0,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for dre_mensais
CREATE INDEX idx_dre_mensais_mes ON public.dre_mensais(mes);

-- RLS Policies for dre_mensais
ALTER TABLE public.dre_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dre_mensais"
  ON public.dre_mensais FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert dre_mensais"
  ON public.dre_mensais FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update dre_mensais"
  ON public.dre_mensais FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete dre_mensais"
  ON public.dre_mensais FOR DELETE
  USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_despesas_mensais_updated_at
  BEFORE UPDATE ON public.despesas_mensais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dre_mensais_updated_at
  BEFORE UPDATE ON public.dre_mensais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add sidebar items
INSERT INTO public.app_tabs (key, label, href, icon, parent_key, tab_group, sort_order, active)
VALUES 
  ('dre', 'D.R.E', '/direcao/dre', 'TrendingUp', 'direcao', 'sidebar', 2, true),
  ('despesas', 'Despesas', '/direcao/despesas', 'Receipt', 'direcao', 'sidebar', 3, true);