INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT au.user_id, 'fabrica_pedidos', true
FROM admin_users au
WHERE au.ativo = true
  AND au.user_id NOT IN (
    SELECT ura.user_id FROM user_route_access ura WHERE ura.route_key = 'fabrica_pedidos'
  )
ON CONFLICT (user_id, route_key) DO UPDATE SET can_access = true;