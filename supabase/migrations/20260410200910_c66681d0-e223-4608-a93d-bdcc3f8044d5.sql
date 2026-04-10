
DO $$
DECLARE
  v_pid UUID := '1ed5836f-9448-4828-88b7-7f2aa8c74a71';
  v_user UUID := 'deabe732-b97e-4a3e-8f03-47209fa205f9';
  v_now TIMESTAMPTZ := now();
BEGIN
  UPDATE pedidos_etapas
  SET data_saida = v_now, updated_at = v_now
  WHERE pedido_id = v_pid AND etapa = 'inspecao_qualidade' AND data_saida IS NULL;

  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, data_saida, checkboxes)
  VALUES (v_pid, 'finalizado', v_now, NULL, '[]'::jsonb)
  ON CONFLICT (pedido_id, etapa) DO UPDATE
  SET data_entrada = v_now, data_saida = NULL, updated_at = v_now;

  UPDATE pedidos_producao
  SET etapa_atual = 'finalizado', status = 'concluido', updated_at = v_now
  WHERE id = v_pid;

  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (v_pid, 'inspecao_qualidade', 'finalizado', v_user, 'avanco', 'Correção: pedido #0081 reaberto acidentalmente em operação em lote, devolvido para Finalizado');
END;
$$;
