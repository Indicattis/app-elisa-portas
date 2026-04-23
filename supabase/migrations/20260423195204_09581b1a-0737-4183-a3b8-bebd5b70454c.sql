-- 1) Atualizar a função de sync para priorizar etapas abertas e ter desempate determinístico
CREATE OR REPLACE FUNCTION public.sync_pedido_etapa_atual()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_etapa text;
BEGIN
  v_pedido_id := COALESCE(NEW.pedido_id, OLD.pedido_id);

  SELECT etapa
  INTO v_etapa
  FROM pedidos_etapas
  WHERE pedido_id = v_pedido_id
  ORDER BY
    (data_saida IS NULL) DESC,
    COALESCE(data_saida, data_entrada) DESC,
    created_at DESC,
    id DESC
  LIMIT 1;

  IF v_etapa IS NOT NULL THEN
    UPDATE pedidos_producao
    SET etapa_atual = v_etapa,
        updated_at = now()
    WHERE id = v_pedido_id
      AND etapa_atual IS DISTINCT FROM v_etapa;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2) Reparar pedidos órfãos cuja etapa_atual está dessincronizada
UPDATE pedidos_producao p
SET etapa_atual = sub.etapa, updated_at = now()
FROM (
  SELECT DISTINCT ON (pedido_id) pedido_id, etapa
  FROM pedidos_etapas
  WHERE data_saida IS NULL
  ORDER BY pedido_id, data_entrada DESC, created_at DESC
) sub
WHERE p.id = sub.pedido_id
  AND p.arquivado = false
  AND p.etapa_atual IS DISTINCT FROM sub.etapa;