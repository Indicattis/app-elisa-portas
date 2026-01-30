-- Atualizar interface das rotas de Estoque para aparecerem em /admin/permissions
UPDATE app_routes 
SET interface = 'padrao'
WHERE key IN ('estoque_hub', 'estoque_fabrica', 'estoque_almoxarifado', 'estoque_fornecedores');