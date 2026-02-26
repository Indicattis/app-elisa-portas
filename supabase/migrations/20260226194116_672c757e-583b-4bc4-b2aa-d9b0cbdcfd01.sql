
-- Arquivar 4 pedidos presos em Instalações
-- IDs: 127b84fd, d470794a, b157f1fe, 4f8504ff

DO $$
DECLARE
  admin_uid uuid := 'd4f3da0b-cadf-4458-8274-1b4997e61033';
  pid uuid;
  pedido_ids uuid[] := ARRAY[
    '127b84fd-3875-4ecb-b43e-651115d8d9e2',
    'd470794a-6e6b-453b-b693-3aa9b33e945b',
    'b157f1fe-bbfc-4c18-86fa-f687bf2ef5b8',
    '4f8504ff-c970-4c69-8557-1aaf2753524b'
  ];
BEGIN
  -- 1. Atualizar pedidos_producao
  UPDATE pedidos_producao
  SET etapa_atual = 'finalizado',
      arquivado = true,
      data_arquivamento = now(),
      updated_at = now()
  WHERE id = ANY(pedido_ids);

  -- Para cada pedido
  FOREACH pid IN ARRAY pedido_ids LOOP
    -- 2. Fechar etapa instalacoes
    UPDATE pedidos_etapas
    SET data_saida = now(), updated_at = now()
    WHERE pedido_id = pid AND etapa = 'instalacoes' AND data_saida IS NULL;

    -- 3. Upsert etapa finalizado
    INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
    VALUES (pid, 'finalizado', '[]'::jsonb, now())
    ON CONFLICT (pedido_id, etapa)
    DO UPDATE SET data_entrada = now(), data_saida = NULL, checkboxes = '[]'::jsonb, updated_at = now();

    -- 4. Movimentação instalacoes -> finalizado
    INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao)
    VALUES (pid, admin_uid, 'instalacoes', 'finalizado', 'avanco', 'Correção manual: pedido já percorreu todo o fluxo');

    -- 5. Movimentação de arquivamento
    INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao)
    VALUES (pid, admin_uid, 'finalizado', 'finalizado', 'reorganizacao', 'Arquivamento manual via correção de dados');
  END LOOP;
END $$;
