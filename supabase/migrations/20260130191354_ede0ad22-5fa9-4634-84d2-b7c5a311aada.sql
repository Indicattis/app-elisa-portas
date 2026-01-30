-- 1. Remover registros duplicados mantendo o mais recente (maior id)
DELETE FROM pedidos_etapas a
USING pedidos_etapas b
WHERE a.pedido_id = b.pedido_id 
  AND a.etapa = b.etapa
  AND a.id < b.id;

-- 2. Criar constraint UNIQUE para permitir ON CONFLICT funcionar
ALTER TABLE pedidos_etapas 
ADD CONSTRAINT pedidos_etapas_pedido_id_etapa_unique 
UNIQUE (pedido_id, etapa);