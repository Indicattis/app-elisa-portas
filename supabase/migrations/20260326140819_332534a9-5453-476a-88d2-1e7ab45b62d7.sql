
-- Inserir novas rotas
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active)
VALUES
  ('vendas_leads', '/vendas/leads', 'Leads', 'minimalista', 'vendas_hub', 7, 'UserPlus', true),
  ('vendas_visitas_tecnicas', '/vendas/visitas-tecnicas', 'Visitas Técnicas', 'minimalista', 'vendas_hub', 8, 'ClipboardCheck', true)
ON CONFLICT (key) DO UPDATE SET active = true, path = EXCLUDED.path, label = EXCLUDED.label;

-- Propagar acesso: quem tem vendas_hub ganha acesso às novas sub-rotas
INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, new_route.key, true
FROM user_route_access ura
CROSS JOIN (VALUES ('vendas_leads'), ('vendas_visitas_tecnicas')) AS new_route(key)
WHERE ura.route_key = 'vendas_hub' AND ura.can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;
