-- =============================================
-- SISTEMA DE PERMISSÕES EM 3 CAMADAS
-- =============================================

-- =============================================
-- CAMADA 2: INTERFACES POR SETOR
-- =============================================

-- Criar enum para tipos de interface
CREATE TYPE public.interface_type AS ENUM (
  'dashboard',
  'producao',
  'admin',
  'vendas_home',
  'instalacoes_home',
  'fabrica_home',
  'logistica_home',
  'administrativo_home'
);

-- Criar tabela de acesso por setor
CREATE TABLE public.setor_interfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor setor_type NOT NULL,
  interface interface_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(setor, interface)
);

-- Habilitar RLS
ALTER TABLE public.setor_interfaces ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage setor_interfaces"
ON public.setor_interfaces FOR ALL
USING (is_admin());

CREATE POLICY "Everyone can view setor_interfaces"
ON public.setor_interfaces FOR SELECT
USING (true);

-- Função de verificação de acesso à interface
CREATE OR REPLACE FUNCTION public.has_interface_access(
  _user_id uuid,
  _interface interface_type
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN public.setor_interfaces si ON au.setor = si.setor
    WHERE au.user_id = _user_id 
      AND si.interface = _interface
      AND au.ativo = true
  );
$$;

-- =============================================
-- CAMADA 3: PERMISSÕES CRUD POR USUÁRIO
-- =============================================

-- Criar enum para recursos
CREATE TYPE public.crud_resource AS ENUM (
  'vendas',
  'pedidos',
  'orcamentos',
  'leads',
  'autorizados',
  'instalacoes',
  'entregas',
  'estoque',
  'ordens_producao',
  'usuarios',
  'fornecedores',
  'veiculos',
  'despesas',
  'investimentos'
);

-- Criar enum para ações CRUD
CREATE TYPE public.crud_action AS ENUM (
  'create',
  'read',
  'update',
  'delete'
);

-- Criar tabela de permissões CRUD por usuário
CREATE TABLE public.user_crud_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource crud_resource NOT NULL,
  action crud_action NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  observacoes text,
  UNIQUE(user_id, resource, action)
);

-- Habilitar RLS
ALTER TABLE public.user_crud_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage user_crud_permissions"
ON public.user_crud_permissions FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their own permissions"
ON public.user_crud_permissions FOR SELECT
USING (auth.uid() = user_id OR is_admin());

-- Função de verificação de permissão CRUD
CREATE OR REPLACE FUNCTION public.has_crud_permission(
  _user_id uuid,
  _resource crud_resource,
  _action crud_action
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_crud_permissions
    WHERE user_id = _user_id 
      AND resource = _resource 
      AND action = _action
  );
$$;

-- =============================================
-- SEED: DADOS PADRÃO
-- =============================================

-- Interfaces por Setor (padrão inicial)
INSERT INTO public.setor_interfaces (setor, interface) VALUES
  ('vendas', 'dashboard'),
  ('vendas', 'vendas_home'),
  ('marketing', 'dashboard'),
  ('marketing', 'vendas_home'),
  ('instalacoes', 'dashboard'),
  ('instalacoes', 'instalacoes_home'),
  ('fabrica', 'producao'),
  ('fabrica', 'fabrica_home'),
  ('fabrica', 'dashboard'),
  ('administrativo', 'dashboard'),
  ('administrativo', 'admin'),
  ('administrativo', 'administrativo_home')
ON CONFLICT (setor, interface) DO NOTHING;