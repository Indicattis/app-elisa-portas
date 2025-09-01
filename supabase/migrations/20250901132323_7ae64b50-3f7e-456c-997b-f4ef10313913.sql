-- Remove user-specific permissions system and simplify access
-- Drop the user_tab_permissions table and related objects
DROP TABLE IF EXISTS public.user_tab_permissions CASCADE;
DROP FUNCTION IF EXISTS public.update_user_tab_permissions_updated_at() CASCADE;

-- Simplify user_tab_access view to allow all authenticated users access to all tabs
DROP VIEW IF EXISTS public.user_tab_access;
CREATE VIEW public.user_tab_access AS
SELECT 
  t.id,
  t.key,
  t.label,
  t.href,
  t.permission,
  t.tab_group,
  t.sort_order,
  t.active,
  t.icon,
  -- All authenticated users can access all active tabs
  CASE 
    WHEN auth.uid() IS NOT NULL THEN true
    ELSE false
  END as can_access
FROM public.app_tabs t
WHERE t.active = true;