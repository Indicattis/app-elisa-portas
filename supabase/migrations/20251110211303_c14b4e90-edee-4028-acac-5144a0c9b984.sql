-- Atualizar o item "Ordens de Produção" para ser filho da pasta "Fábrica"
UPDATE app_tabs
SET parent_key = 'fabrica'
WHERE key = 'ordens';