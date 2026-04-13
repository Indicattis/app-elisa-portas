
-- Add status_aprovacao column to vendas
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS status_aprovacao text NOT NULL DEFAULT 'aprovado';

-- Insert new route for director approval page
INSERT INTO public.app_routes (key, path, label, parent_key, "group", icon, interface, sort_order, active)
VALUES ('direcao_aprovacoes_pedidos', '/direcao/aprovacoes/pedidos', 'Aprovações Pedidos', 'direcao_aprovacoes', 'Direção', 'ClipboardCheck', 'padrao', 1, true)
ON CONFLICT (key) DO NOTHING;

-- Propagate permissions from direcao_aprovacoes to new sub-route
INSERT INTO public.user_route_access (user_id, route_key, can_access)
SELECT ura.user_id, 'direcao_aprovacoes_pedidos', true
FROM public.user_route_access ura
WHERE ura.route_key = 'direcao_aprovacoes' AND ura.can_access = true
ON CONFLICT (user_id, route_key) DO NOTHING;
