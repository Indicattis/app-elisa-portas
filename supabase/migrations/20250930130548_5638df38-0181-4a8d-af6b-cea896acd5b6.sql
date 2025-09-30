-- Atualizar ícones da sidebar para serem mais coerentes
UPDATE app_tabs SET icon = 'Home' WHERE key = 'dashboard';
UPDATE app_tabs SET icon = 'TrendingUp' WHERE key = 'performance';
UPDATE app_tabs SET icon = 'UserPlus' WHERE key = 'leads';
UPDATE app_tabs SET icon = 'FileSpreadsheet' WHERE key = 'orcamentos';
UPDATE app_tabs SET icon = 'ShoppingCart' WHERE key = 'pedidos';
UPDATE app_tabs SET icon = 'MapPin' WHERE key = 'visitas';
UPDATE app_tabs SET icon = 'Cog' WHERE key = 'producao';
UPDATE app_tabs SET icon = 'Handshake' WHERE key = 'parceiros';
UPDATE app_tabs SET icon = 'FolderOpen' WHERE key = 'documentos';
UPDATE app_tabs SET icon = 'Wrench' WHERE key = 'instalacoes';
UPDATE app_tabs SET icon = 'Receipt' WHERE key = 'faturamento';
UPDATE app_tabs SET icon = 'Megaphone' WHERE key = 'marketing';
UPDATE app_tabs SET icon = 'Banknote' WHERE key = 'contas_receber';
UPDATE app_tabs SET icon = 'Network' WHERE key = 'organograma';
UPDATE app_tabs SET icon = 'Calendar' WHERE key = 'calendario';
UPDATE app_tabs SET icon = 'Target' WHERE key = 'contador_vendas';