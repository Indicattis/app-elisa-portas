
DO $$
DECLARE
  pedido_ids uuid[] := ARRAY[
    'd7bc3e76-6306-47a4-8c72-2c4c921c2265',
    '5cb99bc7-a4c2-456a-80c7-2a98d874d02b',
    'c6c70ea4-882f-4e15-b2b4-e79aced9f415',
    '1fb77bf4-0f3b-4c12-9bb1-728fee8ee095',
    '33a6111d-2c24-4fce-8aa7-9c871503cc5d',
    '46af161c-f213-4741-97c2-31a20b568d79'
  ];
  admin_uid uuid := 'd4f3da0b-cadf-4458-8274-1b4997e61033';
  pid uuid;
BEGIN
  FOREACH pid IN ARRAY pedido_ids LOOP
    UPDATE pedidos_producao
    SET etapa_atual = 'finalizado', arquivado = true, data_arquivamento = now(), updated_at = now()
    WHERE id = pid;

    UPDATE pedidos_etapas
    SET data_saida = now(), updated_at = now()
    WHERE pedido_id = pid AND etapa = 'instalacoes' AND data_saida IS NULL;

    INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
    VALUES (pid, 'finalizado', '[]'::jsonb, now())
    ON CONFLICT (pedido_id, etapa) DO UPDATE
    SET data_entrada = now(), data_saida = NULL, checkboxes = '[]'::jsonb, updated_at = now();

    INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao, data_hora)
    VALUES (pid, admin_uid, 'instalacoes', 'finalizado', 'avanco', 'Correção manual: pedido já percorreu todo o fluxo', now());

    INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao, data_hora)
    VALUES (pid, admin_uid, 'finalizado', 'finalizado', 'reorganizacao', 'Arquivamento manual via correção de dados', now());
  END LOOP;
END $$;
