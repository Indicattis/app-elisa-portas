-- Criar sequence para numeração de ordens de pintura
CREATE SEQUENCE IF NOT EXISTS seq_ordem_pintura START 1;

-- Função RPC para criar ordem de pintura
CREATE OR REPLACE FUNCTION criar_ordem_pintura(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_numero_ordem text;
  v_ordem_id uuid;
  v_linha record;
  v_linhas_count integer := 0;
BEGIN
  RAISE LOG '[criar_ordem_pintura] Iniciando para pedido: %', p_pedido_id;
  
  -- Verificar se já existe ordem de pintura para este pedido
  IF EXISTS(SELECT 1 FROM ordens_pintura WHERE pedido_id = p_pedido_id) THEN
    RAISE LOG '[criar_ordem_pintura] Ordem de pintura já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- Gerar número da ordem
  v_numero_ordem := 'PINT-' || LPAD(nextval('seq_ordem_pintura')::text, 5, '0');
  
  -- Criar ordem de pintura
  INSERT INTO ordens_pintura (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_pintura] Ordem de pintura criada: % com número: %', v_ordem_id, v_numero_ordem;
  
  -- Criar linhas apenas para componentes (categoria = 'componente')
  FOR v_linha IN
    SELECT 
      pl.id,
      COALESCE(pl.nome_produto, pl.descricao_produto, 'Item') as item,
      COALESCE(pl.quantidade, 1) as quantidade,
      COALESCE(pl.tamanho, pl.largura::text || ' x ' || pl.altura::text) as medidas,
      e.nome_produto
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
      AND LOWER(e.categoria) = 'componente'
  LOOP
    INSERT INTO linhas_ordens (
      ordem_id,
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida
    ) VALUES (
      v_ordem_id,
      p_pedido_id,
      'pintura',
      v_linha.item,
      v_linha.quantidade,
      v_linha.medidas,
      false
    );
    
    v_linhas_count := v_linhas_count + 1;
    RAISE LOG '[criar_ordem_pintura] Linha de pintura criada para item: %', v_linha.item;
  END LOOP;
  
  RAISE LOG '[criar_ordem_pintura] Finalizado para pedido: %, % linhas criadas', p_pedido_id, v_linhas_count;
END;
$$;

-- Inserir tab na sidebar
INSERT INTO app_tabs (key, label, href, parent_key, sort_order, icon, active)
VALUES ('producao_pintura', 'Pintura', '/dashboard/producao/pintura', 'producao_group', 4, 'Paintbrush', true)
ON CONFLICT (key) DO UPDATE SET 
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon,
  active = EXCLUDED.active;