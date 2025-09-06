-- Ensure app_permission enum has all necessary values
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') THEN
        CREATE TYPE app_permission AS ENUM (
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
            'contador_vendas',
            'configuracoes',
            'users'
        );
    END IF;
END $$;

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role user_role NOT NULL,
    permission app_permission NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    UNIQUE(role, permission)
);

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role_permissions
CREATE POLICY "Authenticated users can view role_permissions" 
ON public.role_permissions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage role_permissions" 
ON public.role_permissions 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Update has_permission function to work with role_permissions table
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission app_permission)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN public.role_permissions rp ON au.role = rp.role
    WHERE au.user_id = _user_id AND rp.permission = _permission AND au.ativo = true
  );
$function$;

-- Create user_permissions view for easy access
CREATE OR REPLACE VIEW public.user_permissions AS
SELECT 
    au.user_id,
    au.role,
    rp.permission,
    au.ativo
FROM public.admin_users au
JOIN public.role_permissions rp ON au.role = rp.role
WHERE au.ativo = true;

-- Update user_tab_access view to include can_access calculation
CREATE OR REPLACE VIEW public.user_tab_access AS
SELECT 
    t.id,
    t.key,
    t.label,
    t.href,
    t.permission,
    t.tab_group,
    t.sort_order,
    t.active,
    t.icon,
    CASE 
        WHEN t.permission IS NULL THEN true
        WHEN is_admin() THEN true
        ELSE has_permission(auth.uid(), t.permission)
    END as can_access
FROM public.app_tabs t
WHERE t.active = true
ORDER BY t.sort_order;

-- Grant necessary permissions
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT SELECT ON public.user_tab_access TO authenticated;

-- Insert default permissions for administrador role
INSERT INTO public.role_permissions (role, permission, created_by) VALUES
('administrador', 'dashboard', null),
('administrador', 'leads', null),
('administrador', 'orcamentos', null),
('administrador', 'vendas', null),
('administrador', 'producao', null),
('administrador', 'calendario', null),
('administrador', 'marketing', null),
('administrador', 'faturamento', null),
('administrador', 'contas_receber', null),
('administrador', 'visitas', null),
('administrador', 'organograma', null),
('administrador', 'contador_vendas', null),
('administrador', 'configuracoes', null),
('administrador', 'users', null)
ON CONFLICT (role, permission) DO NOTHING;