INSERT INTO app_routes (key, path, label, icon, interface, parent_key, sort_order, active)
VALUES ('fabrica_cronograma_producao', '/fabrica/cronograma-producao', 'Cronograma Produção', 'Calendar', 'fabrica', 'fabrica_hub', 25, true)
ON CONFLICT (key) DO NOTHING;