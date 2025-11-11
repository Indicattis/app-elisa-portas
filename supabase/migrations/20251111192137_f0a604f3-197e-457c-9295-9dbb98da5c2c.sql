-- Atualizar ícones das rotas para serem mais característicos e coerentes

-- Dashboard e Marketing
UPDATE app_routes SET icon = 'Home' WHERE key = 'dashboard';
UPDATE app_routes SET icon = 'Megaphone' WHERE key = 'marketing';
UPDATE app_routes SET icon = 'TrendingUp' WHERE key = 'performance';
UPDATE app_routes SET icon = 'Target' WHERE key = 'canais_aquisicao';
UPDATE app_routes SET icon = 'BadgeDollarSign' WHERE key = 'investimentos';

-- Vendas
UPDATE app_routes SET icon = 'ShoppingCart' WHERE key = 'vendas_home';
UPDATE app_routes SET icon = 'FileBarChart' WHERE key = 'vendas_catalogo';
UPDATE app_routes SET icon = 'Calculator' WHERE key = 'orcamentos';
UPDATE app_routes SET icon = 'Receipt' WHERE key = 'tabela_precos';

-- Parceiros (já tem Users, mas vamos especificar os filhos)
UPDATE app_routes SET icon = 'MapPin' WHERE key = 'autorizados';
UPDATE app_routes SET icon = 'Handshake' WHERE key = 'representantes';
UPDATE app_routes SET icon = 'Building2' WHERE key = 'franqueados';

-- Fábrica
UPDATE app_routes SET icon = 'Factory' WHERE key = 'fabrica_home';
UPDATE app_routes SET icon = 'ClipboardList' WHERE key = 'pedidos';
UPDATE app_routes SET icon = 'Hammer' WHERE key = 'ordens';
UPDATE app_routes SET icon = 'BookOpen' WHERE key = 'historico_producao';
UPDATE app_routes SET icon = 'FileSpreadsheet' WHERE key = 'etiquetas';

-- Instalações
UPDATE app_routes SET icon = 'Wrench' WHERE key = 'instalacoes_home';
UPDATE app_routes SET icon = 'CalendarCheck' WHERE key = 'cronograma_instalacoes';

-- Logística
UPDATE app_routes SET icon = 'Truck' WHERE key = 'logistica_home';
UPDATE app_routes SET icon = 'PackageCheck' WHERE key = 'entregas';
UPDATE app_routes SET icon = 'Network' WHERE key = 'frota';

-- Administrativo
UPDATE app_routes SET icon = 'Briefcase' WHERE key = 'administrativo_home';
UPDATE app_routes SET icon = 'FolderOpen' WHERE key = 'documentos';

-- Compras (já tem ShoppingCart, vamos especificar os filhos)
UPDATE app_routes SET icon = 'Users2' WHERE key = 'fornecedores';
UPDATE app_routes SET icon = 'ClipboardSignature' WHERE key = 'requisicoes_compra';
UPDATE app_routes SET icon = 'Package' WHERE key = 'estoque';

-- Financeiro (já tem DollarSign, vamos especificar os filhos)
UPDATE app_routes SET icon = 'CreditCard' WHERE key = 'faturamento';
UPDATE app_routes SET icon = 'PieChart' WHERE key = 'dre';
UPDATE app_routes SET icon = 'Wallet' WHERE key = 'despesas';

-- RH (já tem Users, vamos especificar os filhos)
UPDATE app_routes SET icon = 'UserPlus' WHERE key = 'vagas';