-- Fix the Autorizados tab configuration to use the correct permission
UPDATE public.app_tabs 
SET 
  permission = 'autorizados',
  href = '/autorizados',  
  active = true,
  sort_order = 8
WHERE key = 'autorizados';

-- If the record doesn't exist, insert it
INSERT INTO public.app_tabs (key, label, href, permission, tab_group, sort_order, active, icon)
SELECT 'autorizados', 'Autorizados', '/autorizados', 'autorizados', 'sidebar', 8, true, 'Users'
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_tabs WHERE key = 'autorizados'
);