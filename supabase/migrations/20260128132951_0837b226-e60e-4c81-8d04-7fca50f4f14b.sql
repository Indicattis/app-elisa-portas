-- Corrigir função concluir_carregamento_instalacao para incluir etapa_destino
-- O pedido permanece em 'instalacoes' após o carregamento (não avança)

CREATE OR REPLACE FUNCTION public.concluir_carregamento_instalacao(p_instalacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_etapa_atual text;
BEGIN
  -- Buscar pedido_id e etapa atual da instalação
  SELECT i.pedido_id, pp.etapa_atual 
  INTO v_pedido_id, v_etapa_atual
  FROM instalacoes i
  LEFT JOIN pedidos_producao pp ON pp.id = i.pedido_id
  WHERE i.id = p_instalacao_id;

  -- Marcar carregamento como concluído na tabela instalacoes
  -- O pedido permanece em 'instalacoes' para finalização manual
  UPDATE instalacoes
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = auth.uid(),
      updated_at = now()
  WHERE id = p_instalacao_id;
  
  -- Registrar movimentação COM etapa_destino (obrigatório)
  -- O pedido permanece na mesma etapa (não avança)
  IF v_pedido_id IS NOT NULL THEN
    INSERT INTO pedidos_movimentacoes (
      pedido_id, 
      user_id, 
      etapa_origem, 
      etapa_destino,
      teor, 
      descricao
    )
    VALUES (
      v_pedido_id, 
      auth.uid(), 
      COALESCE(v_etapa_atual, 'instalacoes'),
      COALESCE(v_etapa_atual, 'instalacoes'),
      'carregamento', 
      'Carregamento da instalação concluído'
    );
  END IF;
END;
$$;