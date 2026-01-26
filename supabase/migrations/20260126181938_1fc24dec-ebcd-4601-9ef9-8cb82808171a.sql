-- Add admin_logs route for permissions
INSERT INTO app_routes (key, label, path, interface, parent_key, sort_order, icon, active)
VALUES ('admin_logs', 'Logs do Sistema', '/admin/logs', 'admin', 'admin', 6, 'FileText', true)
ON CONFLICT (key) DO NOTHING;