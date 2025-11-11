-- Adicionar rota admin_permissions como filha de admin
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, sort_order, active)
VALUES ('admin_permissions', '/admin/permissions', 'Permissões', 'Shield', 'admin', 'admin', 2, true);