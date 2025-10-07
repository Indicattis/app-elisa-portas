-- Primeiro, remover a coluna lucro_total que tem dependências
ALTER TABLE vendas 
DROP COLUMN IF EXISTS lucro_total;

-- Remover colunas desnecessárias da tabela vendas
ALTER TABLE vendas 
DROP COLUMN IF EXISTS valor_produto,
DROP COLUMN IF EXISTS custo_produto,
DROP COLUMN IF EXISTS valor_pintura,
DROP COLUMN IF EXISTS custo_pintura,
DROP COLUMN IF EXISTS resgate,
DROP COLUMN IF EXISTS lucro_produto,
DROP COLUMN IF EXISTS lucro_pintura;

-- Adicionar coluna lucro_item na tabela portas_vendas
ALTER TABLE portas_vendas 
ADD COLUMN IF NOT EXISTS lucro_item NUMERIC DEFAULT 0;

-- Recriar lucro_total como coluna normal (será atualizada pelo trigger)
ALTER TABLE vendas
ADD COLUMN lucro_total NUMERIC DEFAULT 0;

-- Adicionar coluna custo_total calculada
ALTER TABLE vendas
ADD COLUMN custo_total NUMERIC GENERATED ALWAYS AS (valor_venda - COALESCE(lucro_total, 0)) STORED;

-- Atualizar trigger para recalcular totais baseado em lucro_item
CREATE OR REPLACE FUNCTION recalcular_totais_venda()
RETURNS TRIGGER AS $$
DECLARE
  venda_uuid uuid;
BEGIN
  venda_uuid := COALESCE(NEW.venda_id, OLD.venda_id);
  
  -- Atualizar totais da venda
  UPDATE vendas
  SET 
    valor_venda = COALESCE((
      SELECT SUM(valor_total) 
      FROM portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    lucro_total = COALESCE((
      SELECT SUM(lucro_item) 
      FROM portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    valor_frete = COALESCE((
      SELECT SUM(valor_frete) 
      FROM portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    valor_instalacao = COALESCE((
      SELECT SUM(valor_instalacao) 
      FROM portas_vendas 
      WHERE venda_id = venda_uuid
    ), 0)
  WHERE id = venda_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;