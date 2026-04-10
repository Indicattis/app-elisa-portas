
DO $$
DECLARE
  v_pedido_ids UUID[] := ARRAY[
    '4a7e6af8-7d58-4ccf-8fc7-5441cf5098a2'::uuid,
    '08e4eddf-ca28-40c8-9b86-150db8fdf18b'::uuid
  ];
  v_pid UUID;
  v_now TIMESTAMPTZ := now();
  v_venda_id UUID;
  v_cliente_nome TEXT;
  v_created_by UUID;
BEGIN
  FOREACH v_pid IN ARRAY v_pedido_ids LOOP

    -- Get order info
    SELECT venda_id, created_by INTO v_venda_id, v_created_by
    FROM pedidos_producao WHERE id = v_pid;

    SELECT cliente_nome INTO v_cliente_nome
    FROM vendas WHERE id = v_venda_id;

    -- 1. Concluir ordens de qualidade pendentes
    UPDATE ordens_qualidade
    SET status = 'concluido', historico = true, updated_at = v_now
    WHERE pedido_id = v_pid AND status = 'pendente';

    -- 2. Fechar etapa atual (inspecao_qualidade)
    UPDATE pedidos_etapas
    SET data_saida = v_now, updated_at = v_now
    WHERE pedido_id = v_pid AND etapa = 'inspecao_qualidade' AND data_saida IS NULL;

    -- 3. Etapas intermediárias (aguardando_pintura, embalagem) - passagem instantânea
    INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, data_saida, checkboxes)
    VALUES
      (v_pid, 'aguardando_pintura', v_now, v_now, '[]'::jsonb),
      (v_pid, 'embalagem', v_now, v_now, '[]'::jsonb)
    ON CONFLICT (pedido_id, etapa) DO UPDATE
    SET data_entrada = v_now, data_saida = v_now, updated_at = v_now;

    -- 4. Etapa instalacoes - aberta
    INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, data_saida, checkboxes)
    VALUES (v_pid, 'instalacoes', v_now, NULL, '[]'::jsonb)
    ON CONFLICT (pedido_id, etapa) DO UPDATE
    SET data_entrada = v_now, data_saida = NULL, updated_at = v_now;

    -- 5. Atualizar etapa atual
    UPDATE pedidos_producao SET etapa_atual = 'instalacoes', updated_at = v_now WHERE id = v_pid;

    -- 6. Registrar movimentações
    INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
    VALUES
      (v_pid, 'inspecao_qualidade', 'aguardando_pintura', v_created_by, 'avanco', 'Avanço manual via correção administrativa'),
      (v_pid, 'aguardando_pintura', 'embalagem', v_created_by, 'avanco', 'Avanço manual via correção administrativa'),
      (v_pid, 'embalagem', 'instalacoes', v_created_by, 'avanco', 'Avanço manual via correção administrativa');

    -- 7. Criar registro de instalação
    INSERT INTO instalacoes (pedido_id, venda_id, nome_cliente, status, hora, created_by)
    VALUES (v_pid, v_venda_id, v_cliente_nome, 'pendente_producao', '08:00', v_created_by)
    ON CONFLICT DO NOTHING;

  END LOOP;
END;
$$;
