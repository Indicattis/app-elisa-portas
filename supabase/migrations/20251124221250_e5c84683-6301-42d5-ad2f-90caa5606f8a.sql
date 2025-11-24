-- Atualizar rota de expedição para nova estrutura hierárquica
UPDATE app_routes 
SET 
  key = 'instalacoes_expedicao',
  path = '/dashboard/instalacoes/expedicao',
  parent_key = 'instalacoes_home',
  "group" = 'instalacoes',
  sort_order = 41,
  label = 'Expedição',
  description = 'Gerenciar ordens de carregamento para entregas e instalações',
  icon = 'Truck',
  updated_at = now()
WHERE key = 'expedicao';

-- Atualizar acessos de usuários para nova chave de rota
UPDATE user_route_access 
SET route_key = 'instalacoes_expedicao',
    updated_at = now()
WHERE route_key = 'expedicao';