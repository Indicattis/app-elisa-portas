-- Inserir novas abas no grupo 'outros_paineis'
INSERT INTO public.app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('modo_tv', 'Modo TV', '/tv-dashboard', 'Tv', 'tv_dashboard', 'outros_paineis', 1, true, null),
  ('mapa_autorizados', 'Mapa de Autorizados', '/mapa-autorizados', 'Map', 'autorizados', 'outros_paineis', 2, true, null),
  ('diario_bordo_painel', 'Diário de Bordo', '/diario-bordo', 'BookOpen', 'diario_bordo', 'outros_paineis', 3, true, null),
  ('configuracoes_painel', 'Configurações', '/configuracoes', 'Settings', 'configuracoes', 'outros_paineis', 4, true, null)
ON CONFLICT (key) DO NOTHING;