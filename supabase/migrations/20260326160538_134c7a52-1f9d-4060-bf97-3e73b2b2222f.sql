
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert user_route_access" ON public.user_route_access;
DROP POLICY IF EXISTS "Admins can update user_route_access" ON public.user_route_access;
DROP POLICY IF EXISTS "Admins can delete user_route_access" ON public.user_route_access;
DROP POLICY IF EXISTS "Admins can view all user_route_access" ON public.user_route_access;

-- Create a helper function to check if user can manage permissions
CREATE OR REPLACE FUNCTION public.can_manage_permissions(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND ativo = true
      AND (
        role = 'administrador'
        OR bypass_permissions = true
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.user_route_access
    WHERE user_id = _user_id
      AND route_key = 'admin_permissions'
      AND can_access = true
  );
$$;

-- Recreate policies using the helper function
CREATE POLICY "Users who can manage permissions - select all"
ON public.user_route_access FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_manage_permissions(auth.uid())
);

CREATE POLICY "Users who can manage permissions - insert"
ON public.user_route_access FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_permissions(auth.uid()));

CREATE POLICY "Users who can manage permissions - update"
ON public.user_route_access FOR UPDATE
TO authenticated
USING (public.can_manage_permissions(auth.uid()))
WITH CHECK (public.can_manage_permissions(auth.uid()));

CREATE POLICY "Users who can manage permissions - delete"
ON public.user_route_access FOR DELETE
TO authenticated
USING (public.can_manage_permissions(auth.uid()));
