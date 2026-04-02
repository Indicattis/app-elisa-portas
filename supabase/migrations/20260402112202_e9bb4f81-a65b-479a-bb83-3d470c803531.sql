UPDATE pedidos_producao SET etapa_atual = 'instalacoes', status = 'instalacoes' WHERE id = '62ceb7ba-33bc-4cbf-8f7c-16ecd1ecceb6' AND etapa_atual = 'aguardando_instalacao';

UPDATE pedidos_etapas SET etapa = 'instalacoes' WHERE pedido_id = '62ceb7ba-33bc-4cbf-8f7c-16ecd1ecceb6' AND etapa = 'aguardando_instalacao';