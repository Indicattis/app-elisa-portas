
DO $$
DECLARE
  v_pid UUID;
  v_user UUID := 'deabe732-b97e-4a3e-8f03-47209fa205f9';
BEGIN
  SELECT id INTO v_pid FROM pedidos_producao WHERE numero_pedido = '0221' LIMIT 1;

  IF v_pid IS NULL THEN
    RAISE EXCEPTION 'Pedido #0221 não encontrado';
  END IF;

  UPDATE pedidos_producao SET etapa_atual = 'correcoes', updated_at = now() WHERE id = v_pid;

  UPDATE pedidos_etapas SET data_saida = NULL, updated_at = now() WHERE pedido_id = v_pid AND etapa = 'correcoes';

  UPDATE pedidos_etapas SET data_saida = now(), updated_at = now() WHERE pedido_id = v_pid AND etapa = 'finalizado' AND data_saida IS NULL;

  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (v_pid, 'finalizado', 'correcoes', v_user, 'avanco', 'Correção manual: pedido #0221 avançou indevidamente para Finalizado ao concluir carregamento de correção. Devolvido para Correções.');
END;
$$;
