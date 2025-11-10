-- Desativar grupo Produção e seus subitens
UPDATE app_tabs 
SET active = false 
WHERE key IN ('producao_group', 'producao_solda', 'producao_perfiladeira', 'producao_separacao', 'producao_pintura', 'qualidade')
OR parent_key = 'producao_group';