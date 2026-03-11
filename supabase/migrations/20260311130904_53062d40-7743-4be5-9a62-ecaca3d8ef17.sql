
DROP POLICY IF EXISTS "Admins podem atualizar roles" ON system_roles;
DROP POLICY IF EXISTS "Admins podem inserir roles" ON system_roles;
DROP POLICY IF EXISTS "Admins podem deletar roles" ON system_roles;

CREATE POLICY "Admins e diretores podem atualizar roles"
ON system_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'diretor')
    AND ativo = true
  )
);

CREATE POLICY "Admins e diretores podem inserir roles"
ON system_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'diretor')
    AND ativo = true
  )
);

CREATE POLICY "Admins e diretores podem deletar roles"
ON system_roles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'diretor')
    AND ativo = true
  )
);
