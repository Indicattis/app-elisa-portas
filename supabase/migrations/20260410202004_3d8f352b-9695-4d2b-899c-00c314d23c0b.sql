DO $$
DECLARE
  v_pid UUID := 'ffc9c0ee-3bd4-40e2-ad00-0dea120af42f';
  v_user UUID := 'deabe732-b97e-4a3e-8f03-47209fa205f9';
BEGIN
  UPDATE pedidos_producao
  SET etapa_atual = 'correcoes', updated_at = now()
  WHERE id = v_pid;

  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (v_pid, 'finalizado', 'correcoes', v_user, 'avanco', 'Correção: pedido #0088 avançou indevidamente para Finalizado ao concluir carregamento. Devolvido para Correções.');
END;
$$;