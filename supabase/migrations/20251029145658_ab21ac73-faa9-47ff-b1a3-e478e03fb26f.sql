-- Criar sequence para numeração de pedidos
CREATE SEQUENCE IF NOT EXISTS pedidos_producao_numero_seq START 1;

-- Função para criar pedido automaticamente ao inserir venda
CREATE OR REPLACE FUNCTION auto_create_pedido_aberto()
RETURNS TRIGGER AS $$
DECLARE
  v_numero_pedido TEXT;
  v_pedido_id UUID;
BEGIN
  -- Gerar próximo número de pedido
  SELECT 'PED-' || LPAD(nextval('pedidos_producao_numero_seq')::text, 6, '0')
  INTO v_numero_pedido;
  
  -- Criar pedido em aberto com dados da venda
  INSERT INTO pedidos_producao (
    venda_id,
    numero_pedido,
    cliente_nome,
    cliente_telefone,
    status,
    etapa_atual,
    prioridade_etapa
  ) VALUES (
    NEW.id,
    v_numero_pedido,
    NEW.cliente_nome,
    NEW.cliente_telefone,
    'em_andamento',
    'aberto',
    0
  ) RETURNING id INTO v_pedido_id;
  
  -- Criar registro de etapa inicial (aberto)
  INSERT INTO pedidos_etapas (
    pedido_id,
    etapa,
    checkboxes,
    data_entrada
  ) VALUES (
    v_pedido_id,
    'aberto',
    '[]'::jsonb,
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_create_pedido_aberto ON vendas;
CREATE TRIGGER trigger_auto_create_pedido_aberto
  AFTER INSERT ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_pedido_aberto();

-- Criar pedidos para vendas de outubro/2025 que não têm pedidos
DO $$
DECLARE
  v_venda RECORD;
  v_numero_pedido TEXT;
  v_pedido_id UUID;
  v_counter INTEGER := 0;
BEGIN
  FOR v_venda IN 
    SELECT 
      v.id,
      v.cliente_nome,
      v.cliente_telefone,
      v.created_at
    FROM vendas v
    WHERE v.created_at >= '2025-10-01' 
      AND v.created_at < '2025-11-01'
      AND NOT EXISTS (
        SELECT 1 FROM pedidos_producao p WHERE p.venda_id = v.id
      )
    ORDER BY v.created_at
  LOOP
    v_counter := v_counter + 1;
    
    -- Gerar número de pedido
    SELECT 'PED-' || LPAD(nextval('pedidos_producao_numero_seq')::text, 6, '0')
    INTO v_numero_pedido;
    
    -- Criar pedido com dados da venda
    INSERT INTO pedidos_producao (
      venda_id,
      numero_pedido,
      cliente_nome,
      cliente_telefone,
      status,
      etapa_atual,
      prioridade_etapa,
      created_at
    ) VALUES (
      v_venda.id,
      v_numero_pedido,
      v_venda.cliente_nome,
      v_venda.cliente_telefone,
      'em_andamento',
      'aberto',
      0,
      v_venda.created_at
    ) RETURNING id INTO v_pedido_id;
    
    -- Criar registro de etapa
    INSERT INTO pedidos_etapas (
      pedido_id,
      etapa,
      checkboxes,
      data_entrada,
      created_at
    ) VALUES (
      v_pedido_id,
      'aberto',
      '[]'::jsonb,
      v_venda.created_at,
      v_venda.created_at
    );
  END LOOP;
  
  RAISE NOTICE 'Criados % pedidos para vendas de outubro', v_counter;
END $$;