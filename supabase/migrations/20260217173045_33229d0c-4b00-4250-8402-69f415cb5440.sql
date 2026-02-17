
-- Recriar função com filtro para excluir itens de separação
CREATE OR REPLACE FUNCTION public.criar_ordem_embalagem(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero_ordem TEXT;
  v_ordem_id UUID;
  v_linha RECORD;
BEGIN
  -- Verificar se já existe uma ordem de embalagem ativa para este pedido
  IF EXISTS (
    SELECT 1 FROM ordens_embalagem 
    WHERE pedido_id = p_pedido_id AND historico = false
  ) THEN
    RAISE NOTICE 'Ordem de embalagem já existe para o pedido %', p_pedido_id;
    RETURN;
  END IF;

  -- Gerar número da ordem
  v_numero_ordem := 'OEM-' || to_char(now(), 'YYYY') || '-' || substr(p_pedido_id::text, 1, 8);

  -- Criar a ordem
  INSERT INTO ordens_embalagem (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;

  -- Copiar linhas do pedido para linhas_ordens com tipo_ordem = 'embalagem'
  -- EXCLUINDO itens de separação (apenas solda e perfiladeira)
  FOR v_linha IN
    SELECT pl.nome_produto, pl.quantidade, pl.tamanho, pl.estoque_id, pl.produto_venda_id
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id
      AND (pl.tipo_ordem IS DISTINCT FROM 'separacao')
  LOOP
    INSERT INTO linhas_ordens (
      ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, estoque_id, produto_venda_id, concluida
    ) VALUES (
      v_ordem_id, p_pedido_id, 'embalagem', v_linha.nome_produto, v_linha.quantidade, v_linha.tamanho, v_linha.estoque_id, v_linha.produto_venda_id, false
    );
  END LOOP;

  RAISE NOTICE 'Ordem de embalagem % criada com sucesso', v_numero_ordem;
END;
$$;

-- Limpar dados existentes: remover linhas de separação das ordens de embalagem ativas
DELETE FROM linhas_ordens lo
USING pedido_linhas pl
WHERE lo.tipo_ordem = 'embalagem'
  AND lo.produto_venda_id = pl.produto_venda_id
  AND lo.pedido_id = pl.pedido_id
  AND pl.tipo_ordem = 'separacao'
  AND EXISTS (
    SELECT 1 FROM ordens_embalagem oe
    WHERE oe.id = lo.ordem_id AND oe.historico = false
  );
