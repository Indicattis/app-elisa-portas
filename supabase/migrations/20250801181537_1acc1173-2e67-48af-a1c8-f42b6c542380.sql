-- Criar enum para roles do sistema
CREATE TYPE public.app_role AS ENUM (
  'administrador',
  'gerente_comercial', 
  'gerente_fabril',
  'atendente'
);

-- Criar enum para permissões/abas do sistema
CREATE TYPE public.app_permission AS ENUM (
  'dashboard',
  'leads',
  'orcamentos',
  'vendas',
  'producao',
  'calendario',
  'marketing',
  'faturamento',
  'contas_receber',
  'visitas',
  'organograma',
  'users'
);

-- Criar tabela de roles do usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Criar tabela de permissões por role
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission app_permission NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(role, permission)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar se usuário tem role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Função security definer para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission app_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  );
$$;

-- Políticas RLS
CREATE POLICY "Admins podem ver todos os roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins podem gerenciar roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins podem ver permissões" ON public.role_permissions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins podem gerenciar permissões" ON public.role_permissions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

-- Inserir permissões padrão para cada role
INSERT INTO public.role_permissions (role, permission, created_by) VALUES
-- Administrador tem acesso a tudo
('administrador', 'dashboard', NULL),
('administrador', 'leads', NULL),
('administrador', 'orcamentos', NULL),
('administrador', 'vendas', NULL),
('administrador', 'producao', NULL),
('administrador', 'calendario', NULL),
('administrador', 'marketing', NULL),
('administrador', 'faturamento', NULL),
('administrador', 'contas_receber', NULL),
('administrador', 'visitas', NULL),
('administrador', 'organograma', NULL),
('administrador', 'users', NULL),

-- Gerente comercial
('gerente_comercial', 'dashboard', NULL),
('gerente_comercial', 'leads', NULL),
('gerente_comercial', 'orcamentos', NULL),
('gerente_comercial', 'vendas', NULL),
('gerente_comercial', 'calendario', NULL),
('gerente_comercial', 'marketing', NULL),
('gerente_comercial', 'faturamento', NULL),
('gerente_comercial', 'contas_receber', NULL),
('gerente_comercial', 'visitas', NULL),
('gerente_comercial', 'organograma', NULL),

-- Gerente fabril
('gerente_fabril', 'dashboard', NULL),
('gerente_fabril', 'producao', NULL),
('gerente_fabril', 'calendario', NULL),
('gerente_fabril', 'organograma', NULL),

-- Atendente
('atendente', 'dashboard', NULL),
('atendente', 'leads', NULL),
('atendente', 'orcamentos', NULL),
('atendente', 'vendas', NULL),
('atendente', 'calendario', NULL),
('atendente', 'visitas', NULL);

-- Migrar roles existentes da tabela admin_users para user_roles
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT user_id, role::app_role, NULL
FROM public.admin_users
WHERE role IS NOT NULL;

-- Adicionar logs mais detalhados no AvatarUpload
CREATE OR REPLACE FUNCTION public.log_avatar_upload()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG 'Avatar upload - Old URL: %, New URL: %, User: %', OLD.foto_perfil_url, NEW.foto_perfil_url, NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_avatar_changes
  AFTER UPDATE OF foto_perfil_url ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_avatar_upload();