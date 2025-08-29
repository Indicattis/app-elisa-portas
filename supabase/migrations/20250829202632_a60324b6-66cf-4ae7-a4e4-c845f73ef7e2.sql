-- Adicionar políticas RLS para admin_users permitindo acesso a usuários com permissão "users"

-- Política para SELECT - permitir visualização a quem tem a permissão "users"
CREATE POLICY "Users with permission can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'users'));

-- Política para INSERT - permitir criação a quem tem a permissão "users"
CREATE POLICY "Users with permission can create admin_users"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'users'));

-- Política para UPDATE - permitir atualização a quem tem a permissão "users"
CREATE POLICY "Users with permission can update admin_users"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (public.has_permission(auth.uid(), 'users'))
WITH CHECK (public.has_permission(auth.uid(), 'users'));