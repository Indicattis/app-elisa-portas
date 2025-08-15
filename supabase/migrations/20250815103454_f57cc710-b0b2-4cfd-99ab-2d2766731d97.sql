-- Adicionar role atendente para o usuário existente
INSERT INTO public.user_roles (user_id, role, created_by)
VALUES ('687c1e07-bfc3-4fed-b074-a9d141f2f1f0', 'atendente', '687c1e07-bfc3-4fed-b074-a9d141f2f1f0')
ON CONFLICT (user_id, role) DO NOTHING;