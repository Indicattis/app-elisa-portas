-- Criar tabela tabela_precos_portas
CREATE TABLE public.tabela_precos_portas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  largura NUMERIC NOT NULL,
  altura NUMERIC NOT NULL,
  valor_porta NUMERIC NOT NULL DEFAULT 0,
  valor_instalacao NUMERIC NOT NULL DEFAULT 0,
  valor_pintura NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.tabela_precos_portas ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
CREATE POLICY "Authenticated users can view tabela_precos_portas"
ON public.tabela_precos_portas
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy para INSERT
CREATE POLICY "Authenticated users can create tabela_precos_portas"
ON public.tabela_precos_portas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Policy para UPDATE
CREATE POLICY "Authenticated users can update tabela_precos_portas"
ON public.tabela_precos_portas
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Policy para DELETE (apenas admins)
CREATE POLICY "Only admins can delete tabela_precos_portas"
ON public.tabela_precos_portas
FOR DELETE
USING (is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_tabela_precos_portas_updated_at
BEFORE UPDATE ON public.tabela_precos_portas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar entrada na sidebar
INSERT INTO public.app_tabs (
  key, 
  label, 
  href, 
  icon, 
  tab_group, 
  parent_key, 
  sort_order, 
  permission, 
  active
) VALUES (
  'tabela_precos',
  'Tabela de Preços',
  '/dashboard/vendas/tabela-precos',
  'DollarSign',
  'sidebar',
  'vendas_group',
  4,
  'tabela_precos',
  true
);

-- Adicionar permissões padrão
INSERT INTO public.role_permissions (role, permission)
VALUES 
  ('atendente', 'tabela_precos'),
  ('gerente_comercial', 'tabela_precos'),
  ('administrador', 'tabela_precos')
ON CONFLICT DO NOTHING;