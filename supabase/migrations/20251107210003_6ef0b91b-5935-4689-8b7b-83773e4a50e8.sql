-- Adicionar item "Etiquetas" no menu lateral dentro de "Fábrica"
INSERT INTO app_tabs (key, label, href, icon, tab_group, parent_key, sort_order, active, permission)
VALUES (
  'fabrica_etiquetas',
  'Etiquetas',
  '/dashboard/fabrica/etiquetas',
  'Tag',
  'sidebar',
  'fabrica',
  50,
  true,
  'producao'
)
ON CONFLICT (key) DO UPDATE 
SET 
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  active = EXCLUDED.active,
  permission = EXCLUDED.permission;