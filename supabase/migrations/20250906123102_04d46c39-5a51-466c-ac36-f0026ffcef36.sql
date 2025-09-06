-- Add new permissions to the app_permission enum in separate statements
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'autorizados';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'performance'; 
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'tv_dashboard';