-- Remover a função e trigger antigos
DROP TRIGGER IF EXISTS trigger_popular_linhas_pedido ON pedidos_producao;
DROP FUNCTION IF EXISTS popular_linhas_pedido_de_venda();

-- Nova função: popular apenas acessórios e adicionais
CREATE OR REPLACE FUNCTION popular_linhas_pedido_acessorios_adicionais()
RETURNS TRIGGER AS $$
DECLARE
  produto_venda RECORD;
  nome_completo TEXT;
  ordem_atual INTEGER := 0;
BEGIN
  -- Para cada produto da venda que seja acessório ou adicional
  FOR produto_venda IN 
    SELECT 
      pv.*,
      ac.nome as nome_acessorio,
      ad.nome as nome_adicional
    FROM produtos_vendas pv
    LEFT JOIN acessorios ac ON pv.acessorio_id = ac.id
    LEFT JOIN adicionais ad ON pv.adicional_id = ad.id
    WHERE pv.venda_id = NEW.venda_id
    AND (pv.acessorio_id IS NOT NULL OR pv.adicional_id IS NOT NULL)
  LOOP
    -- Construir nome do produto
    IF produto_venda.acessorio_id IS NOT NULL THEN
      nome_completo := produto_venda.nome_acessorio;
    ELSE
      nome_completo := produto_venda.nome_adicional;
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
      COALESCE(produto_venda.tamanho, ''),
      ordem_atual
    );

    ordem_atual := ordem_atual + 1;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para popular apenas acessórios e adicionais
CREATE TRIGGER trigger_popular_linhas_pedido_acessorios
  AFTER INSERT ON pedidos_producao
  FOR EACH ROW
  EXECUTE FUNCTION popular_linhas_pedido_acessorios_adicionais();

-- Limpar todas as linhas existentes dos pedidos
DELETE FROM pedido_linhas;

-- Popular linhas apenas com acessórios e adicionais para todos os pedidos existentes
DO $$
DECLARE
  pedido_record RECORD;
  produto_venda RECORD;
  nome_completo TEXT;
  ordem_atual INTEGER;
BEGIN
  -- Para cada pedido
  FOR pedido_record IN 
    SELECT pp.id, pp.venda_id
    FROM pedidos_producao pp
    WHERE pp.venda_id IS NOT NULL
  LOOP
    ordem_atual := 0;
    
    -- Para cada acessório ou adicional da venda deste pedido
    FOR produto_venda IN 
      SELECT 
        pv.*,
        ac.nome as nome_acessorio,
        ad.nome as nome_adicional
      FROM produtos_vendas pv
      LEFT JOIN acessorios ac ON pv.acessorio_id = ac.id
      LEFT JOIN adicionais ad ON pv.adicional_id = ad.id
      WHERE pv.venda_id = pedido_record.venda_id
      AND (pv.acessorio_id IS NOT NULL OR pv.adicional_id IS NOT NULL)
    LOOP
      -- Construir nome do produto
      IF produto_venda.acessorio_id IS NOT NULL THEN
        nome_completo := produto_venda.nome_acessorio;
      ELSE
        nome_completo := produto_venda.nome_adicional;
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
        COALESCE(produto_venda.tamanho, ''),
        ordem_atual
      );

      ordem_atual := ordem_atual + 1;
    END LOOP;
  END LOOP;
END $$;