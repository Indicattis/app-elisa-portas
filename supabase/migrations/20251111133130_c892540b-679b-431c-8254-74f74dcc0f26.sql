-- Criar tabela para controlar acesso a interfaces por cargo
CREATE TABLE IF NOT EXISTS public.role_interface_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  interface interface_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(role, interface)
);

-- Habilitar RLS
ALTER TABLE public.role_interface_access ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem gerenciar
CREATE POLICY "Admins can manage interface access"
ON public.role_interface_access
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Política: Todos podem visualizar (necessário para verificação de acesso)
CREATE POLICY "Anyone can view interface access"
ON public.role_interface_access
FOR SELECT
TO authenticated
USING (true);

-- Atualizar função has_interface_access para considerar role também
CREATE OR REPLACE FUNCTION public.has_interface_access(_user_id uuid, _interface interface_type)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Admin tem acesso a tudo
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = _user_id AND role = 'administrador' AND ativo = true
    ) THEN true
    -- Verificar acesso por setor (tabela existente)
    WHEN EXISTS (
      SELECT 1
      FROM public.admin_users au
      JOIN public.setor_interfaces si ON au.setor = si.setor
      WHERE au.user_id = _user_id 
        AND si.interface = _interface
        AND au.ativo = true
    ) THEN true
    -- Verificar acesso por cargo (nova tabela)
    WHEN EXISTS (
      SELECT 1
      FROM public.admin_users au
      JOIN public.role_interface_access ria ON au.role = ria.role
      WHERE au.user_id = _user_id
        AND ria.interface = _interface
        AND au.ativo = true
    ) THEN true
    ELSE false
  END;
$$;

-- Inserir permissões padrão para interface de produção
INSERT INTO public.role_interface_access (role, interface) VALUES
  ('gerente_fabril', 'producao'),
  ('gerente_producao', 'producao'),
  ('soldador', 'producao'),
  ('pintor', 'producao'),
  ('aux_geral', 'producao'),
  ('aux_pintura', 'producao')
ON CONFLICT (role, interface) DO NOTHING;