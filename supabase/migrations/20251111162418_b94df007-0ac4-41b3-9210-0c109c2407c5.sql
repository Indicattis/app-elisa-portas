-- ============================================
-- REESTRUTURAÇÃO COMPLETA DO SISTEMA DE ROTAS
-- Hierarquia de 3 níveis + Novas páginas home
-- ============================================

-- 1. EXCLUIR ROTAS DE VISITAS
DELETE FROM user_route_access WHERE route_key IN ('visitas', 'visitas_nova');
DELETE FROM app_routes WHERE key IN ('visitas', 'visitas_nova');

-- 2. CRIAR NOVAS ROTAS HOME
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, "group", sort_order, active) VALUES
  ('parceiros_home', '/dashboard/vendas/parceiros', 'Parceiros', 'Users', 'dashboard', 'vendas_home', 'vendas', 16, true),
  ('compras_home', '/dashboard/administrativo/compras', 'Compras', 'ShoppingCart', 'dashboard', 'administrativo_home', 'administrativo', 95, true),
  ('financeiro_home', '/dashboard/administrativo/financeiro', 'Financeiro', 'DollarSign', 'dashboard', 'administrativo_home', 'administrativo', 96, true),
  ('rh_home', '/dashboard/administrativo/rh', 'RH', 'Users', 'dashboard', 'administrativo_home', 'administrativo', 97, true);

-- 3. ATUALIZAR ROTAS EXISTENTES

-- Dashboard (ocultar da sidebar - remover parent_key)
UPDATE app_routes SET parent_key = NULL, sort_order = 0 WHERE key = 'dashboard';

-- Marketing (3 rotas - grupo Marketing)
UPDATE app_routes SET path = '/dashboard/marketing', "group" = 'marketing', sort_order = 5 WHERE key = 'marketing';
UPDATE app_routes SET path = '/dashboard/marketing/performance', parent_key = 'marketing', "group" = 'marketing', sort_order = 6 WHERE key = 'performance';
UPDATE app_routes SET path = '/dashboard/marketing/canais-aquisicao', parent_key = 'marketing', "group" = 'marketing', sort_order = 7 WHERE key = 'canais_aquisicao';
UPDATE app_routes SET path = '/dashboard/marketing/investimentos', parent_key = 'marketing', "group" = 'marketing', sort_order = 8 WHERE key = 'investimentos';

-- Vendas (9 rotas - grupo Vendas)
UPDATE app_routes SET path = '/dashboard/vendas', "group" = 'vendas', sort_order = 10 WHERE key = 'vendas_home';
UPDATE app_routes SET path = '/dashboard/vendas/nova', parent_key = 'vendas_home', "group" = 'vendas', sort_order = 11, active = false WHERE key = 'vendas_nova';
UPDATE app_routes SET path = '/dashboard/vendas/vendas-catalogo', parent_key = 'vendas_home', "group" = 'vendas', sort_order = 12 WHERE key = 'vendas_catalogo';
UPDATE app_routes SET path = '/dashboard/vendas/orcamentos', parent_key = 'vendas_home', "group" = 'vendas', sort_order = 13 WHERE key = 'orcamentos';
UPDATE app_routes SET path = '/dashboard/vendas/tabela-precos', parent_key = 'vendas_home', "group" = 'vendas', sort_order = 14 WHERE key = 'tabela_precos';

-- Parceiros (subpasta de Vendas)
UPDATE app_routes SET path = '/dashboard/vendas/parceiros/autorizados', parent_key = 'parceiros_home', "group" = 'vendas', sort_order = 17 WHERE key = 'autorizados';
UPDATE app_routes SET path = '/dashboard/vendas/parceiros/representantes', parent_key = 'parceiros_home', "group" = 'vendas', sort_order = 18 WHERE key = 'representantes';
UPDATE app_routes SET path = '/dashboard/vendas/parceiros/franqueados', parent_key = 'parceiros_home', "group" = 'vendas', sort_order = 19 WHERE key = 'franqueados';

-- Fábrica (5 rotas - grupo fabrica)
UPDATE app_routes SET path = '/dashboard/fabrica', "group" = 'fabrica', sort_order = 20 WHERE key = 'fabrica_home';
UPDATE app_routes SET path = '/dashboard/fabrica/pedidos', parent_key = 'fabrica_home', "group" = 'fabrica', sort_order = 21 WHERE key = 'pedidos';
UPDATE app_routes SET path = '/dashboard/fabrica/ordens', parent_key = 'fabrica_home', "group" = 'fabrica', sort_order = 22 WHERE key = 'ordens';
UPDATE app_routes SET path = '/dashboard/fabrica/historico-producao', parent_key = 'fabrica_home', "group" = 'fabrica', sort_order = 23 WHERE key = 'historico_producao';
UPDATE app_routes SET path = '/dashboard/fabrica/etiquetas', parent_key = 'fabrica_home', "group" = 'fabrica', sort_order = 24 WHERE key = 'etiquetas';

-- Instalações (2 rotas - grupo instalacoes)
UPDATE app_routes SET path = '/dashboard/instalacoes', "group" = 'instalacoes', sort_order = 30 WHERE key = 'instalacoes_home';
UPDATE app_routes SET path = '/dashboard/instalacoes/cronograma-instalacoes', parent_key = 'instalacoes_home', "group" = 'instalacoes', sort_order = 31 WHERE key = 'cronograma_instalacoes';

-- Remover instalacoes_cadastradas (duplicada)
DELETE FROM app_routes WHERE key = 'instalacoes_cadastradas';

-- Logística (3 rotas - grupo logistica)
UPDATE app_routes SET path = '/dashboard/logistica', "group" = 'logistica', sort_order = 40 WHERE key = 'logistica_home';
UPDATE app_routes SET path = '/dashboard/logistica/entregas', parent_key = 'logistica_home', "group" = 'logistica', sort_order = 41 WHERE key = 'entregas';
UPDATE app_routes SET path = '/dashboard/logistica/frota', parent_key = 'logistica_home', "group" = 'logistica', sort_order = 42 WHERE key = 'frota';

-- Administrativo (10 rotas - grupo administrativo com 3 subpastas)
UPDATE app_routes SET path = '/dashboard/administrativo', "group" = 'administrativo', sort_order = 50 WHERE key = 'administrativo_home';
UPDATE app_routes SET path = '/dashboard/administrativo/documentos', parent_key = 'administrativo_home', "group" = 'administrativo', sort_order = 51 WHERE key = 'documentos';

-- RH (subpasta)
UPDATE app_routes SET path = '/dashboard/administrativo/rh/vagas', parent_key = 'rh_home', "group" = 'administrativo', sort_order = 98 WHERE key = 'vagas';

-- Compras (subpasta)
UPDATE app_routes SET path = '/dashboard/administrativo/compras/fornecedores', parent_key = 'compras_home', "group" = 'administrativo', sort_order = 101 WHERE key = 'fornecedores';
UPDATE app_routes SET path = '/dashboard/administrativo/compras/requisicoes-compra', parent_key = 'compras_home', "group" = 'administrativo', sort_order = 102 WHERE key = 'requisicoes_compra';
UPDATE app_routes SET path = '/dashboard/administrativo/compras/estoque', parent_key = 'compras_home', "group" = 'administrativo', sort_order = 103 WHERE key = 'estoque';

-- Financeiro (subpasta)
UPDATE app_routes SET path = '/dashboard/administrativo/financeiro/faturamento', parent_key = 'financeiro_home', "group" = 'administrativo', sort_order = 111 WHERE key = 'faturamento';
UPDATE app_routes SET path = '/dashboard/administrativo/financeiro/dre', parent_key = 'financeiro_home', "group" = 'administrativo', sort_order = 112 WHERE key = 'dre';
UPDATE app_routes SET path = '/dashboard/administrativo/financeiro/despesas', parent_key = 'financeiro_home', "group" = 'administrativo', sort_order = 113 WHERE key = 'despesas';