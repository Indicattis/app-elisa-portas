
CREATE OR REPLACE FUNCTION sync_pedido_etapa_atual()
RETURNS TRIGGER AS $$
DECLARE
  v_ultima_etapa TEXT;
  v_arquivado BOOLEAN;
BEGIN
  -- Verificar se o pedido esta arquivado
  SELECT arquivado INTO v_arquivado
  FROM pedidos_producao
  WHERE id = NEW.pedido_id;

  -- Se esta arquivado, nao alterar nada
  IF v_arquivado = true THEN
    RETURN NEW;
  END IF;

  -- Buscar a ultima etapa do pedido
  SELECT etapa INTO v_ultima_etapa
  FROM pedidos_etapas
  WHERE pedido_id = NEW.pedido_id
  ORDER BY 
    CASE 
      WHEN data_saida IS NULL THEN data_entrada
      ELSE data_saida
    END DESC
  LIMIT 1;
  
  UPDATE pedidos_producao
  SET 
    etapa_atual = v_ultima_etapa,
    updated_at = now()
  WHERE id = NEW.pedido_id
    AND (etapa_atual IS DISTINCT FROM v_ultima_etapa);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
