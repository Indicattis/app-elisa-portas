INSERT INTO public.app_routes (key, path, label, interface, parent_key, sort_order, icon, active)
VALUES ('direcao_frota', '/direcao/frota', 'Gestão de Frotas', 'minimalista', 'direcao_hub', 7, 'Truck', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, 'direcao_frota', true
FROM public.user_route_access ura
WHERE ura.route_key = 'direcao_hub' AND ura.can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;