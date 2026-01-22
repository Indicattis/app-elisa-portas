-- Inserir rotas minimalistas na tabela app_routes
-- Home (acesso universal)
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active) VALUES
  ('home', '/home', 'Home', 'minimalista', NULL, 0, 'Home', true)
ON CONFLICT (key) DO UPDATE SET interface = 'minimalista', active = true;

-- Rotas Primárias (Hubs)
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active) VALUES
  ('vendas_hub', '/vendas', 'Vendas', 'minimalista', NULL, 1, 'ShoppingCart', true),
  ('fabrica_hub', '/fabrica', 'Fábrica', 'minimalista', NULL, 2, 'Factory', true),
  ('direcao_hub', '/direcao', 'Direção', 'minimalista', NULL, 3, 'Shield', true),
  ('logistica_hub', '/logistica', 'Logística', 'minimalista', NULL, 4, 'Truck', true),
  ('administrativo_hub', '/administrativo', 'Administrativo', 'minimalista', NULL, 5, 'Building2', true)
ON CONFLICT (key) DO UPDATE SET interface = 'minimalista', active = true;

-- Subrotas de Vendas
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active) VALUES
  ('vendas_minhas_vendas', '/vendas/minhas-vendas', 'Minhas Vendas', 'minimalista', 'vendas_hub', 1, 'FileText', true),
  ('vendas_nova', '/vendas/minhas-vendas/nova', 'Nova Venda', 'minimalista', 'vendas_minhas_vendas', 1, 'Plus', true),
  ('vendas_meus_clientes', '/vendas/meus-clientes', 'Meus Clientes', 'minimalista', 'vendas_hub', 2, 'Users', true),
  ('vendas_catalogo', '/vendas/catalogo', 'Catálogo', 'minimalista', 'vendas_hub', 3, 'BookOpen', true),
  ('vendas_meus_orcamentos', '/vendas/meus-orcamentos', 'Meus Orçamentos', 'minimalista', 'vendas_hub', 4, 'Calculator', true),
  ('vendas_meus_parceiros', '/vendas/meus-parceiros', 'Meus Parceiros', 'minimalista', 'vendas_hub', 5, 'Handshake', true)
ON CONFLICT (key) DO UPDATE SET interface = 'minimalista', parent_key = EXCLUDED.parent_key, active = true;

-- Subrotas de Fábrica
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active) VALUES
  ('fabrica_pedidos', '/fabrica/pedidos-producao', 'Pedidos', 'minimalista', 'fabrica_hub', 1, 'ClipboardList', true),
  ('fabrica_estoque', '/fabrica/controle-estoque', 'Estoque', 'minimalista', 'fabrica_hub', 2, 'Package', true),
  ('fabrica_producao', '/fabrica/producao', 'Produção', 'minimalista', 'fabrica_hub', 3, 'Cog', true),
  ('fabrica_solda', '/fabrica/producao/solda', 'Solda', 'minimalista', 'fabrica_producao', 1, 'Flame', true),
  ('fabrica_perfiladeira', '/fabrica/producao/perfiladeira', 'Perfiladeira', 'minimalista', 'fabrica_producao', 2, 'Layers', true),
  ('fabrica_separacao', '/fabrica/producao/separacao', 'Separação', 'minimalista', 'fabrica_producao', 3, 'Split', true),
  ('fabrica_qualidade', '/fabrica/producao/qualidade', 'Qualidade', 'minimalista', 'fabrica_producao', 4, 'CheckCircle', true),
  ('fabrica_pintura', '/fabrica/producao/pintura', 'Pintura', 'minimalista', 'fabrica_producao', 5, 'Paintbrush', true),
  ('fabrica_carregamento', '/fabrica/producao/carregamento', 'Carregamento', 'minimalista', 'fabrica_producao', 6, 'Truck', true),
  ('fabrica_terceirizacao', '/fabrica/producao/terceirizacao', 'Terceirização', 'minimalista', 'fabrica_producao', 7, 'Users', true),
  ('fabrica_meu_historico', '/fabrica/producao/meu-historico', 'Meu Histórico', 'minimalista', 'fabrica_producao', 8, 'History', true)
ON CONFLICT (key) DO UPDATE SET interface = 'minimalista', parent_key = EXCLUDED.parent_key, active = true;

-- Subrotas de Direção
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active) VALUES
  ('direcao_vendas', '/direcao/vendas', 'Vendas', 'minimalista', 'direcao_hub', 1, 'TrendingUp', true),
  ('direcao_clientes', '/direcao/vendas/clientes', 'Clientes', 'minimalista', 'direcao_vendas', 1, 'Users', true),
  ('direcao_faturamento', '/direcao/faturamento', 'Faturamento', 'minimalista', 'direcao_hub', 2, 'DollarSign', true),
  ('direcao_gestao_fabrica', '/direcao/gestao-fabrica', 'Gestão Fábrica', 'minimalista', 'direcao_hub', 3, 'Factory', true),
  ('direcao_gestao_instalacao', '/direcao/gestao-instalacao', 'Gestão Instalação', 'minimalista', 'direcao_hub', 4, 'Wrench', true),
  ('direcao_calendario_expedicao', '/direcao/calendario-expedicao', 'Calendário Expedição', 'minimalista', 'direcao_hub', 5, 'Calendar', true),
  ('direcao_metas', '/direcao/metas', 'Metas', 'minimalista', 'direcao_hub', 6, 'Target', true)
ON CONFLICT (key) DO UPDATE SET interface = 'minimalista', parent_key = EXCLUDED.parent_key, active = true;

-- Subrotas de Logística
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active) VALUES
  ('logistica_controle', '/logistica/controle', 'Controle', 'minimalista', 'logistica_hub', 1, 'ClipboardCheck', true),
  ('logistica_expedicao', '/logistica/expedicao', 'Expedição', 'minimalista', 'logistica_hub', 2, 'Send', true),
  ('logistica_frota', '/logistica/frota', 'Frota', 'minimalista', 'logistica_hub', 3, 'Car', true),
  ('logistica_instalacoes', '/logistica/instalacoes', 'Instalações', 'minimalista', 'logistica_hub', 4, 'Wrench', true),
  ('logistica_ordens', '/logistica/instalacoes/ordens-instalacoes', 'Ordens', 'minimalista', 'logistica_instalacoes', 1, 'FileText', true),
  ('logistica_equipes', '/logistica/instalacoes/equipes', 'Equipes', 'minimalista', 'logistica_instalacoes', 2, 'Users', true),
  ('logistica_cronograma', '/logistica/instalacoes/cronograma', 'Cronograma', 'minimalista', 'logistica_instalacoes', 3, 'Calendar', true)
ON CONFLICT (key) DO UPDATE SET interface = 'minimalista', parent_key = EXCLUDED.parent_key, active = true;

-- Subrotas Administrativo
INSERT INTO app_routes (key, path, label, interface, parent_key, sort_order, icon, active) VALUES
  ('admin_pedidos', '/administrativo/pedidos', 'Pedidos', 'minimalista', 'administrativo_hub', 1, 'ShoppingBag', true),
  ('admin_financeiro', '/administrativo/financeiro', 'Financeiro', 'minimalista', 'administrativo_hub', 2, 'Wallet', true),
  ('admin_faturamento', '/administrativo/financeiro/faturamento', 'Faturamento', 'minimalista', 'admin_financeiro', 1, 'Receipt', true),
  ('admin_faturamento_vendas', '/administrativo/financeiro/faturamento/vendas', 'Vendas', 'minimalista', 'admin_faturamento', 1, 'TrendingUp', true),
  ('admin_faturamento_produtos', '/administrativo/financeiro/faturamento/produtos', 'Produtos', 'minimalista', 'admin_faturamento', 2, 'Package', true),
  ('admin_custos', '/administrativo/financeiro/custos', 'Custos', 'minimalista', 'admin_financeiro', 2, 'PiggyBank', true),
  ('admin_caixa', '/administrativo/financeiro/caixa', 'Caixa', 'minimalista', 'admin_financeiro', 3, 'Banknote', true),
  ('admin_caixa_gestao', '/administrativo/financeiro/caixa/gestao', 'Gestão', 'minimalista', 'admin_caixa', 1, 'Settings', true),
  ('admin_contas_receber', '/administrativo/financeiro/caixa/contas-a-receber', 'Contas a Receber', 'minimalista', 'admin_caixa', 2, 'ArrowDownCircle', true),
  ('admin_contas_pagar', '/administrativo/financeiro/caixa/contas-a-pagar', 'Contas a Pagar', 'minimalista', 'admin_caixa', 3, 'ArrowUpCircle', true)
ON CONFLICT (key) DO UPDATE SET interface = 'minimalista', parent_key = EXCLUDED.parent_key, active = true;