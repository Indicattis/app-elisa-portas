-- Adicionar item pasta "Direção" na sidebar
INSERT INTO public.app_tabs (key, label, href, permission, tab_group, sort_order, active, icon, parent_key)
VALUES 
  ('direcao', 'Direção', '/direcao', NULL, 'sidebar', 100, true, 'Building2', NULL),
  ('checklist-lideranca', 'Checklist Liderança', '/direcao/checklist-lideranca', NULL, 'sidebar', 1, true, 'CheckSquare', 'direcao')
ON CONFLICT (key) DO NOTHING;