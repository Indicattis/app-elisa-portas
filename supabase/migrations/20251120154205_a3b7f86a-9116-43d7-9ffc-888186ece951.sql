-- Atualizar sort_order das rotas existentes após tabela_precos para dar espaço
UPDATE app_routes 
SET sort_order = sort_order + 1 
WHERE parent_key = 'vendas_home' 
AND sort_order >= 16;

-- Inserir nova rota de Contratos
INSERT INTO app_routes (
  key, 
  label, 
  path, 
  icon, 
  parent_key, 
  sort_order, 
  active, 
  interface, 
  description, 
  "group"
) VALUES (
  'contratos_vendas',
  'Contratos',
  '/dashboard/vendas/contratos',
  'ClipboardSignature',
  'vendas_home',
  16,
  true,
  'dashboard',
  'Gestão de contratos de vendas',
  'vendas'
);