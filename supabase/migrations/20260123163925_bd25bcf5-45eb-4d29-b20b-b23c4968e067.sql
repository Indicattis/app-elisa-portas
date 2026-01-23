-- Atualizar paths de /hub-fabrica/producao/* para /producao/*
UPDATE app_routes 
SET path = REPLACE(path, '/hub-fabrica/producao', '/producao'),
    updated_at = now()
WHERE path LIKE '/hub-fabrica/producao%';

-- Atualizar a rota principal /hub-fabrica para /producao
UPDATE app_routes
SET path = '/producao', updated_at = now()
WHERE path = '/hub-fabrica';

-- Deletar rotas de instalações (interface 'instalacoes')
DELETE FROM app_routes 
WHERE interface = 'instalacoes';

-- Deletar rotas de pedidos e metas do hub
DELETE FROM app_routes 
WHERE key IN ('hub_fabrica_pedidos', 'metas');

-- Deletar user_route_access associados às rotas removidas
DELETE FROM user_route_access 
WHERE route_key IN (
  'hub_fabrica_pedidos', 
  'metas',
  'instalacoes_calendario',
  'instalacoes_controle',
  'instalacoes_cronograma',
  'instalacoes_nova',
  'instalacoes_equipes'
);