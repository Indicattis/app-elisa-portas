-- Adicionar novas permissões ao enum app_permission
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'aparencia';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'direcao';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'logistica';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'fornecedores';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'vagas';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'dre';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'entregas';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'despesas';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'dp_rh';