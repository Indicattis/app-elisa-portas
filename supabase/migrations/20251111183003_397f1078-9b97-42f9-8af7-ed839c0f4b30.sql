-- ===========================================================
-- MIGRAÇÃO: Converter user_role de ENUM para TEXT
-- Estratégia: Criar nova coluna, copiar dados, dropar antiga
-- ===========================================================

-- 1. Criar nova coluna role_new do tipo TEXT
ALTER TABLE admin_users ADD COLUMN role_new TEXT;

-- 2. Copiar dados de role para role_new
UPDATE admin_users SET role_new = role::TEXT;

-- 3. Tornar role_new NOT NULL
ALTER TABLE admin_users ALTER COLUMN role_new SET NOT NULL;

-- 4. Dropar a coluna role antiga (CASCADE remove TODAS as dependências)
ALTER TABLE admin_users DROP COLUMN role CASCADE;

-- 5. Renomear role_new para role
ALTER TABLE admin_users RENAME COLUMN role_new TO role;

-- 6. Adicionar foreign key para validar contra system_roles
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_fkey 
  FOREIGN KEY (role) 
  REFERENCES system_roles(key)
  ON DELETE RESTRICT;

-- 7. Recriar política básica para atendentes
CREATE POLICY "Public can view attendants" 
ON admin_users 
FOR SELECT 
USING (ativo = true AND role = 'atendente');

-- 8. Atualizar função has_role para TEXT
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id AND role = _role AND ativo = true
  );
$$;

COMMENT ON COLUMN admin_users.role IS 'Role do usuário (TEXT) - validado via FK contra system_roles.key. Novos roles podem ser criados dinamicamente.';