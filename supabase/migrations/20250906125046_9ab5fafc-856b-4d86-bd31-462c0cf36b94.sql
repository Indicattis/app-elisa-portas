-- Insert default permission for administrador role for instalacoes
INSERT INTO public.role_permissions (role, permission, created_by) VALUES
('administrador', 'instalacoes', null)
ON CONFLICT (role, permission) DO NOTHING;