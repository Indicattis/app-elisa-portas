-- Ensure user_tab_permissions table has proper structure and policies
CREATE TABLE IF NOT EXISTS public.user_tab_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tab_id UUID NOT NULL REFERENCES public.app_tabs(id) ON DELETE CASCADE,
  can_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate permissions per user/tab
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tab_permissions_unique 
ON public.user_tab_permissions(user_id, tab_id);

-- Enable RLS
ALTER TABLE public.user_tab_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_tab_permissions
DROP POLICY IF EXISTS "Admins can manage user_tab_permissions" ON public.user_tab_permissions;
CREATE POLICY "Admins can manage user_tab_permissions" 
ON public.user_tab_permissions 
FOR ALL 
USING (is_admin());

DROP POLICY IF EXISTS "Users can view their own tab permissions" ON public.user_tab_permissions;
CREATE POLICY "Users can view their own tab permissions" 
ON public.user_tab_permissions 
FOR SELECT 
USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_user_tab_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_tab_permissions_updated_at ON public.user_tab_permissions;
CREATE TRIGGER update_user_tab_permissions_updated_at
  BEFORE UPDATE ON public.user_tab_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_tab_permissions_updated_at();

-- Update the user_tab_access view to unify access rules
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
  -- Check access: user override takes precedence, then role permission, default to false
  COALESCE(
    utp.can_access,  -- User-specific override
    CASE 
      WHEN t.permission IS NULL THEN true  -- No permission required
      ELSE has_permission(auth.uid(), t.permission::app_permission)  -- Role-based permission
    END,
    false
  ) as can_access
FROM public.app_tabs t
LEFT JOIN public.user_tab_permissions utp ON t.id = utp.tab_id AND utp.user_id = auth.uid()
WHERE t.active = true;