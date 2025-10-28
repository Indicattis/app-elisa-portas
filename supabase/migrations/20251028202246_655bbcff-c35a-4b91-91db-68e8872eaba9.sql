-- Inserir permissões para roles
INSERT INTO public.role_permissions (role, permission)
VALUES 
  ('diretor', 'checklist_lideranca'),
  ('administrador', 'checklist_lideranca'),
  ('gerente_comercial', 'checklist_lideranca'),
  ('gerente_fabril', 'checklist_lideranca'),
  ('gerente_marketing', 'checklist_lideranca'),
  ('gerente_financeiro', 'checklist_lideranca'),
  ('gerente_producao', 'checklist_lideranca'),
  ('gerente_instalacoes', 'checklist_lideranca')
ON CONFLICT DO NOTHING;

-- Adicionar "Checklist Liderança" como subitem em todos os grupos da sidebar
INSERT INTO public.app_tabs (key, label, href, icon, parent_key, permission, sort_order, active, tab_group)
SELECT 
  'checklist_lideranca_' || key as key,
  'Checklist Liderança' as label,
  '/dashboard/checklist-lideranca' as href,
  'CheckSquare' as icon,
  key as parent_key,
  'checklist_lideranca' as permission,
  999 as sort_order,
  true as active,
  'sidebar' as tab_group
FROM public.app_tabs
WHERE parent_key IS NULL AND active = true AND tab_group = 'sidebar'
ON CONFLICT (key) DO NOTHING;