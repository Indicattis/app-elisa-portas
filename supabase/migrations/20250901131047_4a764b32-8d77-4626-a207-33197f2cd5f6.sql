-- Tabela para armazenar permissões de abas por usuário
CREATE TABLE public.user_tab_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tab_id UUID NOT NULL REFERENCES public.app_tabs(id) ON DELETE CASCADE,
  can_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tab_id)
);

-- Enable RLS
ALTER TABLE public.user_tab_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can manage user_tab_permissions" 
ON public.user_tab_permissions 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create or replace the user_tab_access view to include permissions
CREATE OR REPLACE VIEW public.user_tab_access AS
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
  COALESCE(utp.can_access, true) as can_access
FROM public.app_tabs t
LEFT JOIN public.user_tab_permissions utp ON t.id = utp.tab_id AND utp.user_id = auth.uid()
WHERE t.active = true;

-- Update trigger for updated_at
CREATE TRIGGER update_user_tab_permissions_updated_at
  BEFORE UPDATE ON public.user_tab_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();