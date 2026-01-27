-- ============================================
-- PARTE 1: Criar função para concluir carregamento de instalações
-- Esta função NÃO avança o pedido para finalizado
-- ============================================
CREATE OR REPLACE FUNCTION public.concluir_carregamento_instalacao(p_instalacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
BEGIN
  -- Buscar pedido_id da instalação
  SELECT pedido_id INTO v_pedido_id
  FROM instalacoes
  WHERE id = p_instalacao_id;

  -- Marcar carregamento como concluído na tabela instalacoes
  -- O pedido permanece em 'instalacoes' para finalização manual
  UPDATE instalacoes
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = auth.uid(),
      updated_at = now()
  WHERE id = p_instalacao_id;
  
  -- Registrar movimentação
  IF v_pedido_id IS NOT NULL THEN
    INSERT INTO pedidos_movimentacoes (pedido_id, user_id, teor, descricao)
    VALUES (v_pedido_id, auth.uid(), 'carregamento', 'Carregamento da instalação concluído');
  END IF;
END;
$$;

-- ============================================
-- PARTE 2: Modificar função existente para NÃO avançar instalações
-- ============================================
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
  -- Buscar dados necessários
  SELECT oc.pedido_id, pp.etapa_atual, v.tipo_entrega
  INTO v_pedido_id, v_etapa_atual, v_tipo_entrega
  FROM ordens_carregamento oc
  LEFT JOIN pedidos_producao pp ON pp.id = oc.pedido_id
  LEFT JOIN vendas v ON v.id = oc.venda_id
  WHERE oc.id = p_ordem_carregamento_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Ordem de carregamento não encontrada ou sem pedido associado';
  END IF;

  -- Marcar ordem de carregamento como concluída (SEMPRE)
  UPDATE ordens_carregamento
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = auth.uid(),
      status = 'concluida',
      updated_at = now()
  WHERE id = p_ordem_carregamento_id;

  -- IMPORTANTE: Apenas avançar para finalizado se for ENTREGA
  -- Para instalação/manutenção, o carregamento é gerenciado via tabela instalacoes
  IF v_tipo_entrega = 'entrega' THEN
    -- Fechar etapa atual
    UPDATE pedidos_etapas
    SET data_saida = now()
    WHERE pedido_id = v_pedido_id 
      AND data_saida IS NULL;

    -- Avançar pedido para finalizado
    UPDATE pedidos_producao
    SET etapa_atual = 'finalizado',
        status = 'concluido',
        updated_at = now()
    WHERE id = v_pedido_id;

    -- Registrar entrada na etapa finalizado
    INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
    VALUES (v_pedido_id, 'finalizado', now(), '[]'::jsonb)
    ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = now();
    
    -- Registrar movimentação
    INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao)
    VALUES (v_pedido_id, auth.uid(), v_etapa_atual, 'finalizado', 'avanco', 'Pedido finalizado após conclusão do carregamento');
  END IF;
END;
$$;

-- ============================================
-- PARTE 3: Limpar ordens de carregamento duplicadas para instalações
-- Remove ordens que existem redundantemente quando já há instalação
-- ============================================
DELETE FROM ordens_carregamento oc
WHERE EXISTS (
  SELECT 1 FROM instalacoes i 
  WHERE i.pedido_id = oc.pedido_id
    AND i.pedido_id IS NOT NULL
)
AND oc.carregamento_concluido = false;