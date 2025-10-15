-- Remove políticas duplicadas e conflitantes
DROP POLICY IF EXISTS "Admins podem gerenciar permissões" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins podem ver permissões" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can view role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Users can read permissions for their roles" ON public.role_permissions;

-- Criar políticas corretas
-- Administradores podem gerenciar todas as permissões
CREATE POLICY "Admins can manage all role_permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Usuários autenticados podem visualizar permissões
CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);