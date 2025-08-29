
-- Permitir que usuários autenticados leiam suas próprias roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'administrador'));

-- Permitir que usuários autenticados leiam as permissões das roles que possuem
CREATE POLICY "Users can read permissions for their roles"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), role) OR public.has_role(auth.uid(), 'administrador'));
