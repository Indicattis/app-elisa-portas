INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT au.user_id, 'paineis_metas_vendas', true
FROM public.admin_users au
WHERE au.ativo = true
ON CONFLICT (user_id, route_key) DO UPDATE SET can_access = true;