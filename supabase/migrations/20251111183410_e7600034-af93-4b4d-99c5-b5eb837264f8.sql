-- Adicionar políticas RLS para system_roles
-- Apenas administradores podem gerenciar roles

-- Permitir admins visualizarem todos os roles
CREATE POLICY "Admins podem visualizar roles"
ON system_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() 
    AND role = 'administrador' 
    AND ativo = true
  )
);

-- Permitir admins criarem roles
CREATE POLICY "Admins podem criar roles"
ON system_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() 
    AND role = 'administrador' 
    AND ativo = true
  )
);

-- Permitir admins atualizarem roles
CREATE POLICY "Admins podem atualizar roles"
ON system_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() 
    AND role = 'administrador' 
    AND ativo = true
  )
);

-- Permitir admins deletarem roles
CREATE POLICY "Admins podem deletar roles"
ON system_roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() 
    AND role = 'administrador' 
    AND ativo = true
  )
);