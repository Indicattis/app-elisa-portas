-- Drop e recriar a funcao RPC para aceitar 'instalacoes' como etapa valida
DROP FUNCTION IF EXISTS public.concluir_carregamento_e_avancar_pedido(uuid);

CREATE OR REPLACE FUNCTION public.concluir_carregamento_e_avancar_pedido(p_ordem_carregamento_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_etapa_atual text;
  v_tipo_entrega text;
BEGIN
  -- Buscar pedido_id da ordem de carregamento
  SELECT oc.pedido_id, pp.etapa_atual, v.tipo_entrega
  INTO v_pedido_id, v_etapa_atual, v_tipo_entrega
  FROM ordens_carregamento oc
  JOIN pedidos_producao pp ON pp.id = oc.pedido_id
  JOIN vendas v ON v.id = oc.venda_id
  WHERE oc.id = p_ordem_carregamento_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Ordem de carregamento não encontrada';
  END IF;

  -- Validar etapa atual - aceita aguardando_coleta e instalacoes
  IF v_etapa_atual NOT IN ('aguardando_coleta', 'instalacoes') THEN
    RAISE EXCEPTION 'Pedido deve estar em "Expedição Coleta" ou "Instalações" para concluir carregamento. Etapa atual: %', v_etapa_atual;
  END IF;

  -- Marcar ordem como concluída
  UPDATE ordens_carregamento
  SET carregamento_concluido = true,
      status = 'concluida',
      updated_at = now()
  WHERE id = p_ordem_carregamento_id;

  -- Avançar pedido para finalizado
  UPDATE pedidos_producao
  SET etapa_atual = 'finalizado',
      updated_at = now()
  WHERE id = v_pedido_id;

  -- Se for instalação, marcar a instalação como concluída também
  IF v_tipo_entrega = 'instalacao' THEN
    UPDATE instalacoes
    SET status = 'concluida',
        concluida = true,
        updated_at = now()
    WHERE pedido_id = v_pedido_id;
  END IF;

  -- Registrar entrada na etapa finalizado
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (v_pedido_id, 'finalizado', now(), '[]'::jsonb)
  ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now();

END;
$$;