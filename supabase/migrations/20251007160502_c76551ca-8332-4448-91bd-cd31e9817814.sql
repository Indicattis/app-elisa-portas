
-- Ativar abas da Fábrica que estavam desativadas
UPDATE app_tabs 
SET active = true 
WHERE key IN ('pedidos', 'producao', 'calendario') 
  AND parent_key = 'fabrica';
