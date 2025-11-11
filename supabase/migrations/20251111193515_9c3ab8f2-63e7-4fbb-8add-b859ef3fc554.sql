-- Atualizar ícones das rotas da interface producao
UPDATE app_routes SET icon = 'Hammer' WHERE key = 'producao_solda';
UPDATE app_routes SET icon = 'Boxes' WHERE key = 'producao_perfiladeira';
UPDATE app_routes SET icon = 'Package' WHERE key = 'producao_separacao';
UPDATE app_routes SET icon = 'Sparkles' WHERE key = 'producao_pintura';
UPDATE app_routes SET icon = 'CheckSquare' WHERE key = 'producao_qualidade';
UPDATE app_routes SET icon = 'Truck' WHERE key = 'producao_carregamento';