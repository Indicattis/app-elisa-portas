-- Adicionar rota para controle de permissões
INSERT INTO app_routes (key, label, path, interface, parent_key, sort_order, icon, active)
VALUES ('fabrica_ordens_pedidos', 'Ordens por Pedido', '/fabrica/ordens-pedidos', 'padrao', 'fabrica_hub', 2, 'ClipboardList', true)
ON CONFLICT (key) DO NOTHING;