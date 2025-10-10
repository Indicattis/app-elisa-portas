-- Adicionar novas permissões ao enum app_permission
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'estoque';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'compras';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'cronograma_instalacoes';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'rh_admin';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'representantes';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'licenciados';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'investimentos';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pedidos';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'canais_aquisicao';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'forca_vendas';