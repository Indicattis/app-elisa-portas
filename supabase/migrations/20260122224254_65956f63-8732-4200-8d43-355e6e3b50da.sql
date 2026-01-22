-- Adicionar coluna bypass_permissions na tabela admin_users
ALTER TABLE public.admin_users 
ADD COLUMN bypass_permissions BOOLEAN DEFAULT false;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.admin_users.bypass_permissions IS 'Se true, o usuário ignora todas as verificações de permissão de rotas';

-- Por segurança, definir um usuário específico com bypass (opcional - pode ser feito depois via interface)
-- UPDATE admin_users SET bypass_permissions = true WHERE email = 'master@empresa.com';