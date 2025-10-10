-- Atualizar tabela app_tabs com as novas permissões
UPDATE app_tabs SET permission = 'estoque' WHERE key = 'estoque';
UPDATE app_tabs SET permission = 'compras' WHERE key = 'compras';
UPDATE app_tabs SET permission = 'cronograma_instalacoes' WHERE key = 'cronograma';
UPDATE app_tabs SET permission = 'rh_admin' WHERE key = 'rh';
UPDATE app_tabs SET permission = 'representantes' WHERE key = 'representantes';
UPDATE app_tabs SET permission = 'licenciados' WHERE key = 'licenciados';
UPDATE app_tabs SET permission = 'investimentos' WHERE key = 'investimentos';
UPDATE app_tabs SET permission = 'pedidos' WHERE key = 'pedidos';
UPDATE app_tabs SET permission = 'canais_aquisicao' WHERE key = 'canais-aquisicao';
UPDATE app_tabs SET permission = 'forca_vendas' WHERE key = 'forca-vendas';