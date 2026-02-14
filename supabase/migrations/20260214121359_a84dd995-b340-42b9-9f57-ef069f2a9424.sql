
-- Reordenar existentes
UPDATE app_routes SET sort_order = 9 WHERE key = 'producao_carregamento';
UPDATE app_routes SET sort_order = 10 WHERE key = 'producao_terceirizacao';
UPDATE app_routes SET sort_order = 11 WHERE key = 'producao_conferencia_estoque';
UPDATE app_routes SET sort_order = 12 WHERE key = 'producao_conferencia_almox';

-- Inserir novas rotas
INSERT INTO app_routes (key, path, label, interface, sort_order, active)
VALUES 
  ('producao_embalagem', '/producao/embalagem', 'Embalagem', 'producao', 7, true),
  ('producao_instalacoes', '/producao/instalacoes', 'Instalações', 'producao', 8, true);
