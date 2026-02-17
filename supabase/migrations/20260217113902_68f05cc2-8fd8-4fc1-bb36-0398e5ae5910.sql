
-- Mover os 4 pedidos sem pintura da embalagem para suas próximas etapas

-- 1. Fechar etapa embalagem dos 4 pedidos
UPDATE pedidos_etapas
SET data_saida = now(), updated_at = now()
WHERE etapa = 'embalagem'
  AND data_saida IS NULL
  AND pedido_id IN (
    '035b9de8-d633-4675-bcc2-b9eda82b7e3f',  -- 0189 → aguardando_coleta
    '5cb99bc7-a4c2-456a-80c7-2a98d874d02b',  -- 0194 → instalacoes
    '82ae710b-da40-42fa-9c52-c420c32267c1',  -- 0216 → instalacoes
    'd17e8a29-756d-438a-bc09-111325079f40'   -- 0217 → aguardando_coleta
  );

-- 2. Criar etapas destino e atualizar etapa_atual

-- 0189 → aguardando_coleta
INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
VALUES ('035b9de8-d633-4675-bcc2-b9eda82b7e3f', 'aguardando_coleta', '[]'::jsonb, now())
ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now(), data_saida = NULL, checkboxes = '[]'::jsonb, updated_at = now();

UPDATE pedidos_producao SET etapa_atual = 'aguardando_coleta', updated_at = now()
WHERE id = '035b9de8-d633-4675-bcc2-b9eda82b7e3f';

-- 0194 → instalacoes
INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
VALUES ('5cb99bc7-a4c2-456a-80c7-2a98d874d02b', 'instalacoes', '[]'::jsonb, now())
ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now(), data_saida = NULL, checkboxes = '[]'::jsonb, updated_at = now();

UPDATE pedidos_producao SET etapa_atual = 'instalacoes', updated_at = now()
WHERE id = '5cb99bc7-a4c2-456a-80c7-2a98d874d02b';

-- 0216 → instalacoes
INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
VALUES ('82ae710b-da40-42fa-9c52-c420c32267c1', 'instalacoes', '[]'::jsonb, now())
ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now(), data_saida = NULL, checkboxes = '[]'::jsonb, updated_at = now();

UPDATE pedidos_producao SET etapa_atual = 'instalacoes', updated_at = now()
WHERE id = '82ae710b-da40-42fa-9c52-c420c32267c1';

-- 0217 → aguardando_coleta
INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
VALUES ('d17e8a29-756d-438a-bc09-111325079f40', 'aguardando_coleta', '[]'::jsonb, now())
ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now(), data_saida = NULL, checkboxes = '[]'::jsonb, updated_at = now();

UPDATE pedidos_producao SET etapa_atual = 'aguardando_coleta', updated_at = now()
WHERE id = 'd17e8a29-756d-438a-bc09-111325079f40';
