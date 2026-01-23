-- Criar rota producao_hub para o menu flutuante
INSERT INTO app_routes (key, path, label, description, interface, sort_order, active, parent_key)
VALUES ('producao_hub', '/producao', 'Produção', 'Hub principal de produção - Menu Flutuante', 'producao', 0, true, NULL)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  active = true;