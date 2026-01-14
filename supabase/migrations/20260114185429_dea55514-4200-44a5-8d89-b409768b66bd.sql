-- Atualizar paths das rotas de produção para usar prefixo /hub-fabrica
UPDATE app_routes 
SET path = REPLACE(path, '/producao', '/hub-fabrica/producao'),
    updated_at = now()
WHERE interface = 'producao' 
  AND path LIKE '/producao%';

-- Atualizar paths das rotas de instalações para usar prefixo /hub-fabrica
UPDATE app_routes 
SET path = REPLACE(path, '/instalacoes', '/hub-fabrica/instalacoes'),
    updated_at = now()
WHERE interface = 'instalacoes' 
  AND path LIKE '/instalacoes%';