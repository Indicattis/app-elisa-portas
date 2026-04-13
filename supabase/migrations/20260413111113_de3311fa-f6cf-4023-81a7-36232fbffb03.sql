
-- Inserir novas rotas
INSERT INTO public.app_routes (key, path, label, icon, sort_order, interface, parent_key, active)
VALUES
  ('fabrica_embalagem', '/fabrica/producao/embalagem', 'Embalagem', 'Package', 670, 'padrao', 'fabrica_producao', true),
  ('fabrica_arquivo_morto', '/fabrica/arquivo-morto', 'Arquivo Morto', 'Archive', 900, 'padrao', 'fabrica_hub', true),
  ('direcao_dre', '/direcao/dre', 'DRE', 'BarChart3', 210, 'padrao', 'direcao_hub', true),
  ('direcao_autorizados', '/direcao/autorizados', 'Autorizados', 'UserCheck', 220, 'padrao', 'direcao_hub', true),
  ('direcao_aprovacoes', '/direcao/aprovacoes', 'Aprovações', 'CheckCircle', 230, 'padrao', 'direcao_hub', true),
  ('direcao_checklist', '/direcao/checklist-lideranca', 'Checklist Liderança', 'ClipboardCheck', 240, 'padrao', 'direcao_hub', true),
  ('direcao_gestao_colaboradores', '/direcao/gestao-colaboradores', 'Gestão de Colaboradores', 'Users', 250, 'padrao', 'direcao_hub', true),
  ('direcao_metas_instalacoes', '/direcao/metas/instalacoes', 'Metas Instalações', 'Target', 260, 'padrao', 'direcao_hub', true),
  ('direcao_regras_vendas', '/direcao/vendas/regras-vendas', 'Regras de Vendas', 'BookOpen', 270, 'padrao', 'direcao_hub', true),
  ('direcao_tabela_precos', '/direcao/vendas/tabela-precos', 'Tabela de Preços', 'DollarSign', 280, 'padrao', 'direcao_hub', true),
  ('logistica_autorizados', '/logistica/autorizados', 'Autorizados', 'UserCheck', 310, 'padrao', 'logistica_hub', true),
  ('logistica_pedidos_sem_entrega', '/logistica/pedidos-sem-entrega', 'Pedidos sem Entrega', 'PackageX', 320, 'padrao', 'logistica_hub', true),
  ('logistica_ranking', '/logistica/instalacoes/ranking', 'Ranking Equipes', 'Trophy', 330, 'padrao', 'logistica_hub', true),
  ('admin_multas', '/administrativo/multas', 'Multas', 'AlertTriangle', 410, 'padrao', 'administrativo_hub', true),
  ('admin_gastos', '/administrativo/financeiro/gastos', 'Gastos', 'Receipt', 420, 'padrao', 'administrativo_hub', true),
  ('admin_bancos', '/administrativo/financeiro/bancos', 'Bancos', 'Landmark', 430, 'padrao', 'administrativo_hub', true),
  ('admin_rh_dp_vagas', '/administrativo/rh-dp/vagas', 'Vagas', 'Briefcase', 440, 'padrao', 'administrativo_hub', true),
  ('admin_rh_dp_responsabilidades', '/administrativo/rh-dp/responsabilidades', 'Responsabilidades', 'ListChecks', 450, 'padrao', 'administrativo_hub', true),
  ('admin_rh_dp_funcoes', '/administrativo/rh-dp/funcoes', 'Funções', 'Wrench', 460, 'padrao', 'administrativo_hub', true),
  ('admin_rh_dp_folha', '/administrativo/rh-dp/colaboradores/folha-pagamento', 'Folha de Pagamento', 'Wallet', 470, 'padrao', 'administrativo_hub', true),
  ('estoque_conferencia', '/estoque/conferencia', 'Conferência', 'ClipboardList', 510, 'padrao', 'estoque_hub', true),
  ('estoque_auditoria', '/estoque/auditoria', 'Auditoria', 'Search', 520, 'padrao', 'estoque_hub', true),
  ('marketing_conversoes', '/marketing/conversoes', 'Conversões', 'TrendingUp', 610, 'padrao', 'marketing_hub', true)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path, label = EXCLUDED.label, icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order, interface = EXCLUDED.interface,
  parent_key = EXCLUDED.parent_key, active = EXCLUDED.active;

-- Propagar permissões: Direção
INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, nr.key, true
FROM public.user_route_access ura
CROSS JOIN public.app_routes nr
WHERE ura.route_key = 'direcao_hub' AND ura.can_access = true
  AND nr.key IN ('direcao_dre','direcao_autorizados','direcao_aprovacoes','direcao_checklist','direcao_gestao_colaboradores','direcao_metas_instalacoes','direcao_regras_vendas','direcao_tabela_precos')
ON CONFLICT (user_id, route_key) DO NOTHING;

-- Logística
INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, nr.key, true
FROM public.user_route_access ura
CROSS JOIN public.app_routes nr
WHERE ura.route_key = 'logistica_hub' AND ura.can_access = true
  AND nr.key IN ('logistica_autorizados','logistica_pedidos_sem_entrega','logistica_ranking')
ON CONFLICT (user_id, route_key) DO NOTHING;

-- Administrativo
INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, nr.key, true
FROM public.user_route_access ura
CROSS JOIN public.app_routes nr
WHERE ura.route_key = 'administrativo_hub' AND ura.can_access = true
  AND nr.key IN ('admin_multas','admin_gastos','admin_bancos','admin_rh_dp_vagas','admin_rh_dp_responsabilidades','admin_rh_dp_funcoes','admin_rh_dp_folha')
ON CONFLICT (user_id, route_key) DO NOTHING;

-- Estoque
INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, nr.key, true
FROM public.user_route_access ura
CROSS JOIN public.app_routes nr
WHERE ura.route_key = 'estoque_hub' AND ura.can_access = true
  AND nr.key IN ('estoque_conferencia','estoque_auditoria')
ON CONFLICT (user_id, route_key) DO NOTHING;

-- Marketing
INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, 'marketing_conversoes', true
FROM public.user_route_access ura
WHERE ura.route_key = 'marketing_hub' AND ura.can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;

-- Fábrica
INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, 'fabrica_arquivo_morto', true
FROM public.user_route_access ura
WHERE ura.route_key = 'fabrica_hub' AND ura.can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;

INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, 'fabrica_embalagem', true
FROM public.user_route_access ura
WHERE ura.route_key = 'fabrica_producao' AND ura.can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;
