-- Inserir rota de expedição no app_routes
INSERT INTO app_routes (key, path, label, description, icon, sort_order, active, interface, "group")
VALUES (
  'expedicao',
  '/expedicao',
  'Expedição',
  'Gerenciar ordens de carregamento para entregas e instalações',
  'Truck',
  40,
  true,
  'dashboard',
  'logistica'
) ON CONFLICT (key) DO NOTHING;