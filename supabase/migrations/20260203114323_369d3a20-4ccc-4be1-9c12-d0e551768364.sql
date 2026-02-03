-- Adicionar rotas de conferência à interface de produção
INSERT INTO app_routes (key, path, label, description, interface, active, sort_order)
VALUES 
  ('producao_conferencia_estoque', '/producao/conferencia-estoque', 'Conferência - Estoque', 'Conferência de estoque da fábrica', 'producao', true, 10),
  ('producao_conferencia_almox', '/producao/conferencia-almox', 'Conferência - Almoxarifado', 'Conferência de produtos do almoxarifado', 'producao', true, 11);