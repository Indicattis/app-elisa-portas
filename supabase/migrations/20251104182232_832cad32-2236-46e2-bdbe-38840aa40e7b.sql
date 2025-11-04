-- Criar enum para status da vaga
CREATE TYPE public.status_vaga AS ENUM ('em_analise', 'aberta', 'fechada', 'preenchida');

-- Criar tabela de vagas
CREATE TABLE public.vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo user_role NOT NULL,
  justificativa text NOT NULL,
  status status_vaga NOT NULL DEFAULT 'em_analise',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para otimização
CREATE INDEX idx_vagas_status ON public.vagas(status);
CREATE INDEX idx_vagas_cargo ON public.vagas(cargo);
CREATE INDEX idx_vagas_created_by ON public.vagas(created_by);

-- Trigger para atualização automática de updated_at
CREATE TRIGGER update_vagas_updated_at
  BEFORE UPDATE ON public.vagas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vagas"
  ON public.vagas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create vagas"
  ON public.vagas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update vagas"
  ON public.vagas FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete vagas"
  ON public.vagas FOR DELETE
  USING (is_admin());

-- Inserir itens na sidebar
-- Item pasta: DP/RH
INSERT INTO public.app_tabs (key, label, href, icon, parent_key, tab_group, sort_order, active)
VALUES ('dp-rh', 'DP/RH', '/dp-rh', 'Users', NULL, 'sidebar', 101, true);

-- Subitem: Vagas
INSERT INTO public.app_tabs (key, label, href, icon, parent_key, tab_group, sort_order, active)
VALUES ('vagas', 'Vagas', '/dp-rh/vagas', 'Briefcase', 'dp-rh', 'sidebar', 1, true);