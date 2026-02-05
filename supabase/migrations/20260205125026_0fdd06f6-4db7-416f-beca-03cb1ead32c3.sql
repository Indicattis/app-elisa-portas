-- Adicionar rota Arquivo Morto ao sistema de permissões
INSERT INTO app_routes (key, label, path, "group", interface, parent_key, sort_order, active, description, icon)
VALUES (
  'fabrica_arquivo_morto',
  'Arquivo Morto',
  '/fabrica/arquivo-morto',
  'Fábrica',
  'Padrão',
  'fabrica_hub',
  60,
  true,
  'Visualização de pedidos arquivados da fábrica',
  'Archive'
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  "group" = EXCLUDED."group",
  interface = EXCLUDED.interface,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;