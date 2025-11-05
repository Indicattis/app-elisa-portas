-- Remover todos os itens que adicionei em outros_paineis (exceto os que já existiam)
DELETE FROM app_tabs 
WHERE tab_group = 'outros_paineis' 
AND key NOT IN ('diario_bordo_painel', 'configuracoes_painel');

-- Adicionar apenas os itens solicitados em Outros Painéis

-- 1. Modo TV
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('modo_tv_painel', 'Modo TV', '/tv-dashboard', 'Tv', 'tv_dashboard', 'outros_paineis', 1, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'tv_dashboard',
  sort_order = 1;

-- 2. Mapa de Autorizados
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('mapa_autorizados_painel', 'Mapa de Autorizados', '/mapa-autorizados', 'Map', 'autorizados', 'outros_paineis', 2, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'autorizados',
  sort_order = 2;

-- 3. Diário de Bordo (já existe, apenas atualizar)
UPDATE app_tabs 
SET sort_order = 3
WHERE key = 'diario_bordo_painel';

-- 4. Calendário
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('calendario_painel', 'Calendário', '/dashboard/calendario', 'Calendar', 'calendario', 'outros_paineis', 4, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'calendario',
  sort_order = 4;

-- 5. Contador de Vendas
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('contador_vendas_painel', 'Contador de Vendas', '/dashboard/contador-vendas', 'Calculator', 'contador_vendas', 'outros_paineis', 5, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'contador_vendas',
  sort_order = 5;

-- 6. Checklist Liderança
INSERT INTO app_tabs (key, label, href, icon, permission, tab_group, sort_order, active, parent_key)
VALUES 
  ('checklist_lideranca_painel', 'Checklist Liderança', '/dashboard/todo', 'CheckSquare', 'checklist_lideranca', 'outros_paineis', 6, true, null)
ON CONFLICT (key) DO UPDATE SET
  tab_group = 'outros_paineis',
  active = true,
  permission = 'checklist_lideranca',
  sort_order = 6;

-- Atualizar Configurações para ordem 7
UPDATE app_tabs 
SET sort_order = 7
WHERE key = 'configuracoes_painel';