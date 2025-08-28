-- Adicionar permissões que estavam faltando para alguns roles
INSERT INTO public.role_permissions (role, permission) VALUES
('atendente', 'calendario'),
('atendente', 'visitas')
ON CONFLICT (role, permission) DO NOTHING;