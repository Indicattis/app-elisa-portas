-- Função para popular linhas do pedido a partir dos produtos da venda
CREATE OR REPLACE FUNCTION popular_linhas_pedido_de_venda()
RETURNS TRIGGER AS $$
DECLARE
  produto_venda RECORD;
  nome_completo TEXT;
  ordem_atual INTEGER := 0;
BEGIN
  -- Para cada produto da venda, criar uma linha no pedido
  FOR produto_venda IN 
    SELECT 
      pv.*,
      ac.nome as nome_acessorio,
      ad.nome as nome_adicional
    FROM produtos_vendas pv
    LEFT JOIN acessorios ac ON pv.acessorio_id = ac.id
    LEFT JOIN adicionais ad ON pv.adicional_id = ad.id
    WHERE pv.venda_id = NEW.venda_id
  LOOP
    -- Construir nome do produto
    IF produto_venda.acessorio_id IS NOT NULL THEN
      nome_completo := produto_venda.nome_acessorio;
    ELSIF produto_venda.adicional_id IS NOT NULL THEN
      nome_completo := produto_venda.nome_adicional;
    ELSE
      nome_completo := produto_venda.tipo_produto;
    END IF;

    -- Inserir linha no pedido
    INSERT INTO pedido_linhas (
      pedido_id,
      nome_produto,
      descricao_produto,
      quantidade,
      tamanho,
      ordem
    ) VALUES (
      NEW.id,
      nome_completo,
      produto_venda.descricao,
      COALESCE(produto_venda.quantidade, 1),
      produto_venda.tamanho,
      ordem_atual
    );

    ordem_atual := ordem_atual + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para popular linhas automaticamente após criar pedido
DROP TRIGGER IF EXISTS trigger_popular_linhas_pedido ON pedidos_producao;
CREATE TRIGGER trigger_popular_linhas_pedido
  AFTER INSERT ON pedidos_producao
  FOR EACH ROW
  EXECUTE FUNCTION popular_linhas_pedido_de_venda();

-- Popular linhas para todos os pedidos existentes que ainda não têm linhas
DO $$
DECLARE
  pedido_record RECORD;
  produto_venda RECORD;
  nome_completo TEXT;
  ordem_atual INTEGER;
BEGIN
  -- Para cada pedido que não tem linhas
  FOR pedido_record IN 
    SELECT pp.id, pp.venda_id
    FROM pedidos_producao pp
    WHERE pp.venda_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pedido_linhas pl WHERE pl.pedido_id = pp.id
    )
  LOOP
    ordem_atual := 0;
    
    -- Para cada produto da venda deste pedido
    FOR produto_venda IN 
      SELECT 
        pv.*,
        ac.nome as nome_acessorio,
        ad.nome as nome_adicional
      FROM produtos_vendas pv
      LEFT JOIN acessorios ac ON pv.acessorio_id = ac.id
      LEFT JOIN adicionais ad ON pv.adicional_id = ad.id
      WHERE pv.venda_id = pedido_record.venda_id
    LOOP
      -- Construir nome do produto
      IF produto_venda.acessorio_id IS NOT NULL THEN
        nome_completo := produto_venda.nome_acessorio;
      ELSIF produto_venda.adicional_id IS NOT NULL THEN
        nome_completo := produto_venda.nome_adicional;
      ELSE
        nome_completo := produto_venda.tipo_produto;
      END IF;

      -- Inserir linha no pedido
      INSERT INTO pedido_linhas (
        pedido_id,
        nome_produto,
        descricao_produto,
        quantidade,
        tamanho,
        ordem
      ) VALUES (
        pedido_record.id,
        nome_completo,
        produto_venda.descricao,
        COALESCE(produto_venda.quantidade, 1),
        produto_venda.tamanho,
        ordem_atual
      );

      ordem_atual := ordem_atual + 1;
    END LOOP;
  END LOOP;
END $$;