-- Fix role_permissions RLS to allow authenticated users to read permissions
-- but restrict INSERT/UPDATE/DELETE to admins only

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage role_permissions" ON public.role_permissions;

-- Allow all authenticated users to view role permissions (needed for permission checking)
CREATE POLICY "Authenticated users can view role_permissions" 
ON public.role_permissions 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Only admins can manage (INSERT/UPDATE/DELETE) role permissions
CREATE POLICY "Admins can insert role_permissions" 
ON public.role_permissions 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update role_permissions" 
ON public.role_permissions 
FOR UPDATE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete role_permissions" 
ON public.role_permissions 
FOR DELETE 
TO authenticated
USING (is_admin());

-- Ensure the "Autorizados" tab exists with correct permission
INSERT INTO public.app_tabs (key, label, href, permission, tab_group, sort_order, active, icon)
VALUES ('autorizados', 'Autorizados', '/autorizados', 'view_autorizados', 'sidebar', 8, true, 'Users')
ON CONFLICT (key) DO UPDATE SET
  permission = 'view_autorizados',
  tab_group = 'sidebar', 
  active = true,
  href = '/autorizados';