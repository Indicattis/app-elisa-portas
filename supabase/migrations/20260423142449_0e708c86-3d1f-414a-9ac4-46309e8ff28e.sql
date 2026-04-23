
INSERT INTO public.app_routes (key, label, path, interface, icon, "group", sort_order, active, description)
VALUES ('paineis_metas_vendas', 'Metas de Vendas', '/paineis/metas-vendas', 'paineis', 'Target', 'paineis', 60, true, 'Painel de progresso de metas de vendas com tiers')
ON CONFLICT (key) DO NOTHING;
