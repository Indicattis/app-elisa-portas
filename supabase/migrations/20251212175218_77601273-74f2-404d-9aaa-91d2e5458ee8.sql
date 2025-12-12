-- Adicionar colunas na tabela admin_users
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS eh_colaborador BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS salario NUMERIC(10,2) DEFAULT NULL;

-- Inserir nova rota na tabela app_routes
INSERT INTO public.app_routes (key, path, label, parent_key, icon, sort_order, interface, "group", active, description)
VALUES (
  'colaboradores',
  '/dashboard/administrativo/rh/colaboradores',
  'Colaboradores',
  'rh_home',
  'Users',
  10,
  'admin',
  'administrativo',
  true,
  'Visualizar colaboradores da empresa'
) ON CONFLICT (key) DO NOTHING;