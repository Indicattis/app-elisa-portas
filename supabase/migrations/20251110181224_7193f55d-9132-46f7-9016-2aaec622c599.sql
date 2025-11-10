-- Remover o grupo "Produção" da sidebar
DELETE FROM app_tabs WHERE key = 'producao' OR parent_key = 'producao';