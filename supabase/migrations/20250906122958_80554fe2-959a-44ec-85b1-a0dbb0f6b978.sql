-- Add new permissions to the app_permission enum
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'autorizados';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'performance';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'tv_dashboard';

-- Insert default permissions for administrador role for the new permissions
INSERT INTO public.role_permissions (role, permission, created_by) VALUES
('administrador', 'autorizados', null),
('administrador', 'performance', null),
('administrador', 'tv_dashboard', null)
ON CONFLICT (role, permission) DO NOTHING;