-- Adicionar itens do menu hambúrguer e outras funcionalidades em Outros Painéis

-- Dashboard/Home
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('dashboard_painel', 'Dashboard', '/dashboard', 'LayoutDashboard', 'dashboard', 'outros_paineis', 1, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'dashboard',
  sort_order = 1;

-- Performance
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('performance_painel', 'Performance', '/performance', 'TrendingUp', 'performance', 'outros_paineis', 2, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'performance',
  sort_order = 2;

-- Leads (Força de Vendas)
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('leads_painel', 'Leads', '/dashboard/forca-vendas', 'Target', 'leads', 'outros_paineis', 5, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'leads',
  sort_order = 5;

-- Orçamentos
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('orcamentos_painel', 'Orçamentos', '/dashboard/orcamentos', 'FileText', 'orcamentos', 'outros_paineis', 6, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'orcamentos',
  sort_order = 6;

-- Vendas
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('vendas_painel', 'Vendas', '/dashboard/vendas', 'ShoppingCart', 'vendas', 'outros_paineis', 7, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'vendas',
  sort_order = 7;

-- Pedidos
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('pedidos_painel', 'Pedidos', '/dashboard/pedidos', 'ClipboardList', 'pedidos', 'outros_paineis', 8, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'pedidos',
  sort_order = 8;

-- Produção
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('producao_painel', 'Produção', '/dashboard/fabrica/home', 'Factory', 'producao', 'outros_paineis', 9, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'producao',
  sort_order = 9;

-- Instalações
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('instalacoes_painel', 'Instalações', '/dashboard/instalacoes', 'Wrench', 'instalacoes', 'outros_paineis', 10, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'instalacoes',
  sort_order = 10;

-- Cronograma Instalações
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('cronograma_instalacoes_painel', 'Cronograma', '/dashboard/cronograma-instalacoes', 'CalendarDays', 'cronograma_instalacoes', 'outros_paineis', 11, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'cronograma_instalacoes',
  sort_order = 11;

-- Calendário
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('calendario_painel', 'Calendário', '/dashboard/calendario', 'Calendar', 'calendario', 'outros_paineis', 12, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'calendario',
  sort_order = 12;

-- Marketing
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('marketing_painel', 'Marketing', '/dashboard/marketing', 'Megaphone', 'marketing', 'outros_paineis', 13, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'marketing',
  sort_order = 13;

-- Faturamento
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('faturamento_painel', 'Faturamento', '/dashboard/faturamento', 'DollarSign', 'faturamento', 'outros_paineis', 14, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'faturamento',
  sort_order = 14;

-- Contas a Receber
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('contas_receber_painel', 'Contas a Receber', '/dashboard/contas-receber', 'Receipt', 'contas_receber', 'outros_paineis', 15, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'contas_receber',
  sort_order = 15;

-- Documentos (já existe, garantir que está em outros_paineis)
UPDATE app_tabs 
SET tab_group = 'outros_paineis', sort_order = 16
WHERE key = 'diario_bordo_painel';

-- Estoque
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('estoque_painel', 'Estoque', '/dashboard/estoque', 'Package', 'estoque', 'outros_paineis', 17, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'estoque',
  sort_order = 17;

-- Compras
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('compras_painel', 'Compras', '/dashboard/compras', 'ShoppingBag', 'compras', 'outros_paineis', 18, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'compras',
  sort_order = 18;

-- Visitas
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('visitas_painel', 'Visitas', '/dashboard/visitas', 'MapPin', 'visitas', 'outros_paineis', 19, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'visitas',
  sort_order = 19;

-- Autorizados
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('autorizados_painel', 'Autorizados', '/dashboard/autorizados', 'Award', 'autorizados', 'outros_paineis', 20, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'autorizados',
  sort_order = 20;

-- Representantes
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('representantes_painel', 'Representantes', '/dashboard/representantes', 'Briefcase', 'representantes', 'outros_paineis', 21, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'representantes',
  sort_order = 21;

-- Franqueados
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('franqueados_painel', 'Franqueados', '/dashboard/franqueados', 'Store', 'franqueados', 'outros_paineis', 22, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'franqueados',
  sort_order = 22;

-- Investimentos
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('investimentos_painel', 'Investimentos', '/dashboard/investimentos', 'TrendingUp', 'investimentos', 'outros_paineis', 23, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'investimentos',
  sort_order = 23;

-- Canais de Aquisição
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('canais_aquisicao_painel', 'Canais de Aquisição', '/dashboard/canais-aquisicao', 'Filter', 'canais_aquisicao', 'outros_paineis', 24, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'canais_aquisicao',
  sort_order = 24;

-- Tabela de Preços
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('tabela_precos_painel', 'Tabela de Preços', '/dashboard/tabela-precos', 'ListChecks', 'tabela_precos', 'outros_paineis', 25, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'tabela_precos',
  sort_order = 25;

-- RH Admin
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('rh_admin_painel', 'RH Admin', '/dashboard/rh-admin', 'Users', 'rh_admin', 'outros_paineis', 26, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'rh_admin',
  sort_order = 26;

-- Contador de Vendas
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('contador_vendas_painel', 'Contador de Vendas', '/dashboard/contador-vendas', 'Calculator', 'contador_vendas', 'outros_paineis', 27, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'contador_vendas',
  sort_order = 27;

-- Checklist Liderança (estava removido mas permissão existe)
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('checklist_lideranca_painel', 'Checklist Liderança', '/dashboard/todo', 'CheckSquare', 'checklist_lideranca', 'outros_paineis', 28, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'checklist_lideranca',
  sort_order = 28;