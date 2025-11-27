-- Desativar subitens do Estoque na sidebar
UPDATE app_routes 
SET active = false 
WHERE parent_key = 'estoque' 
  AND key IN ('estoque_gerenciamento', 'estoque_editar');