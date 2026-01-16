-- Adicionar rota /hub-fabrica/pedidos na interface producao
INSERT INTO app_routes (key, path, label, description, interface, icon, sort_order, active)
VALUES (
  'hub_fabrica_pedidos',
  '/hub-fabrica/pedidos',
  'Pedidos',
  'Visualização de pedidos no Hub Fábrica',
  'producao',
  'ClipboardList',
  0,
  true
)
ON CONFLICT (key) DO UPDATE SET
  interface = 'producao',
  sort_order = 0;

-- Mover rota /hub-fabrica/metas para interface producao
UPDATE app_routes 
SET interface = 'producao', sort_order = 9
WHERE key = 'metas' AND path = '/hub-fabrica/metas';