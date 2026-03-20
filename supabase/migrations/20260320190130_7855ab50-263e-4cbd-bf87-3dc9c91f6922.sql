INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT DISTINCT user_id, new_route.key, true
FROM user_route_access
CROSS JOIN (VALUES ('marketing_ltv'), ('marketing_midias')) AS new_route(key)
WHERE route_key LIKE 'marketing%' AND can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;