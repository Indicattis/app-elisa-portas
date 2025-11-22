-- Adicionar nova rota de Controle de Produção
INSERT INTO app_routes (
  key, 
  path, 
  label, 
  description, 
  "group", 
  icon, 
  sort_order, 
  active, 
  interface
) VALUES (
  'producao_controle',
  '/producao/controle',
  'Controle de Produção',
  'Dashboard com indicadores e status de pedidos',
  'fabrica',
  'BarChart3',
  22,
  true,
  'producao'
);