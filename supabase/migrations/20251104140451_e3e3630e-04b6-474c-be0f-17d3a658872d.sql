
-- Mover as tabs do dropdown menu do header para o grupo 'header'
UPDATE app_tabs 
SET tab_group = 'header'
WHERE key IN ('modo_tv', 'mapa_autorizados', 'organograma', 'diario_bordo', 'calendario', 'contador_vendas');
