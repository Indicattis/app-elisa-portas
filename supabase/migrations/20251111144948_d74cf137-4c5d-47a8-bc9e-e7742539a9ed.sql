-- Excluir rotas obsoletas
DELETE FROM app_routes WHERE key IN ('vendas_forca', 'compras', 'rh_admin');

-- Atualizar rotas de VENDAS
UPDATE app_routes SET path = '/dashboard/vendas', "group" = 'Vendas' WHERE key = 'vendas_home';
UPDATE app_routes SET path = '/dashboard/vendas/tabela-precos', "group" = 'Vendas' WHERE key = 'tabela_precos';
UPDATE app_routes SET path = '/dashboard/vendas/parceiros/autorizados', "group" = 'Vendas' WHERE key = 'autorizados';
UPDATE app_routes SET path = '/dashboard/vendas/parceiros/representantes', "group" = 'Vendas' WHERE key = 'representantes';
UPDATE app_routes SET path = '/dashboard/vendas/parceiros/franqueados', "group" = 'Vendas' WHERE key = 'franqueados';
UPDATE app_routes SET path = '/dashboard/vendas/visitas', "group" = 'Vendas' WHERE key = 'visitas';

-- Criar grupo PAINÉIS (novo)
UPDATE app_routes SET path = '/paineis/contador-vendas', "group" = 'Painéis' WHERE key = 'contador_vendas';
UPDATE app_routes SET path = '/dashboard/paineis/mapa', "group" = 'Painéis' WHERE key = 'mapa_autorizados';
UPDATE app_routes SET path = '/dashboard/paineis/diario-bordo', "group" = 'Painéis' WHERE key = 'diario_bordo';
UPDATE app_routes SET path = '/dashboard/paineis/calendario', "group" = 'Painéis' WHERE key = 'calendario';

-- Atualizar HOMES (Fábrica, Instalações, Logística)
UPDATE app_routes SET path = '/dashboard/fabrica' WHERE key = 'fabrica_home';
UPDATE app_routes SET path = '/dashboard/instalacoes' WHERE key = 'instalacoes_home';
UPDATE app_routes SET path = '/dashboard/logistica' WHERE key = 'logistica_home';

-- Atualizar FINANCEIRO
UPDATE app_routes SET path = '/dashboard/financeiro/faturamento', "group" = 'Financeiro' WHERE key = 'faturamento';
UPDATE app_routes SET path = '/dashboard/financeiro/dre', "group" = 'Financeiro' WHERE key = 'dre';
UPDATE app_routes SET path = '/dashboard/financeiro/despesas', "group" = 'Financeiro' WHERE key = 'despesas';
UPDATE app_routes SET path = '/dashboard/financeiro/investimentos', "group" = 'Financeiro' WHERE key = 'investimentos';

-- Atualizar COMPRAS
UPDATE app_routes SET path = '/dashboard/compras/fornecedores', "group" = 'Compras' WHERE key = 'fornecedores';
UPDATE app_routes SET path = '/dashboard/compras/requisicoes-compra', "group" = 'Compras' WHERE key = 'requisicoes_compra';
UPDATE app_routes SET path = '/dashboard/compras/estoque', "group" = 'Compras' WHERE key = 'estoque';

-- Atualizar MARKETING
UPDATE app_routes SET path = '/dashboard/marketing/home', "group" = 'Marketing' WHERE key = 'marketing';
UPDATE app_routes SET path = '/dashboard/marketing/canais-aquisicao', "group" = 'Marketing' WHERE key = 'canais_aquisicao';

-- Atualizar ADMINISTRATIVO
UPDATE app_routes SET path = '/admin/users', "group" = 'Admin' WHERE key = 'users';
UPDATE app_routes SET path = '/dashboard/administrativo/rh/vagas', "group" = 'Administrativo' WHERE key = 'vagas';
UPDATE app_routes SET path = '/dashboard/administrativo/documentos', "group" = 'Administrativo' WHERE key = 'documentos';

-- Atualizar TODO
UPDATE app_routes SET path = '/todo', "group" = 'Tarefas' WHERE key = 'todo';