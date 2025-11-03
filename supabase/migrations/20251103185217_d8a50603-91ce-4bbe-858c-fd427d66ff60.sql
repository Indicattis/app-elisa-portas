-- Adicionar colunas para agrupar por porta nas linhas de ordem
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS produto_venda_id uuid;
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS cor_nome text;
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS tipo_pintura text;
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS largura numeric;
ALTER TABLE linhas_ordens ADD COLUMN IF NOT EXISTS altura numeric;

-- Recriar função criar_ordem_pintura com agrupamento por porta
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
  v_cor_nome text;
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
  
  -- Criar linhas agrupadas por porta (produto_venda_id)
  FOR v_linha IN
    SELECT 
      pl.produto_venda_id,
      pl.largura,
      pl.altura,
      COALESCE(pl.nome_produto, pl.descricao_produto, 'Item') as item,
      COALESCE(pl.quantidade, 1) as quantidade,
      COALESCE(pl.tamanho, pl.largura::text || ' x ' || pl.altura::text) as medidas,
      e.nome_produto,
      pv.cor_id,
      pv.tipo_pintura,
      cc.nome as cor_nome
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    LEFT JOIN produtos_vendas pv ON pl.produto_venda_id = pv.id
    LEFT JOIN catalogo_cores cc ON pv.cor_id = cc.id
    WHERE pl.pedido_id = p_pedido_id
      AND LOWER(e.categoria) = 'componente'
    ORDER BY pl.produto_venda_id, pl.ordem
  LOOP
    INSERT INTO linhas_ordens (
      ordem_id,
      pedido_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      produto_venda_id,
      cor_nome,
      tipo_pintura,
      largura,
      altura
    ) VALUES (
      v_ordem_id,
      p_pedido_id,
      'pintura',
      v_linha.item,
      v_linha.quantidade,
      v_linha.medidas,
      false,
      v_linha.produto_venda_id,
      v_linha.cor_nome,
      v_linha.tipo_pintura,
      v_linha.largura,
      v_linha.altura
    );
    
    v_linhas_count := v_linhas_count + 1;
    RAISE LOG '[criar_ordem_pintura] Linha de pintura criada para item: % (Porta: %, Cor: %)', 
      v_linha.item, v_linha.produto_venda_id, v_linha.cor_nome;
  END LOOP;
  
  RAISE LOG '[criar_ordem_pintura] Finalizado para pedido: %, % linhas criadas', p_pedido_id, v_linhas_count;
END;
$$;