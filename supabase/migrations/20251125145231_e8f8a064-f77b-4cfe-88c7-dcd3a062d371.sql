-- Adicionar campo sku na tabela estoque
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS sku text;

-- Criar índice único para o SKU
CREATE UNIQUE INDEX IF NOT EXISTS estoque_sku_unique ON public.estoque(sku) WHERE sku IS NOT NULL;

-- Criar função para gerar SKU sequencial
CREATE OR REPLACE FUNCTION public.generate_estoque_sku()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_sku TEXT;
BEGIN
  -- Só gera se o SKU não foi fornecido
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    -- Buscar o maior número atual
    SELECT COALESCE(MAX(CAST(SUBSTRING(sku FROM 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.estoque
    WHERE sku ~ '^ep[0-9]+$';
    
    -- Formatar com zeros à esquerda (3 dígitos mínimo)
    new_sku := 'ep' || LPAD(next_number::TEXT, 3, '0');
    NEW.sku := new_sku;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-gerar SKU em novos itens
DROP TRIGGER IF EXISTS trigger_generate_estoque_sku ON public.estoque;
CREATE TRIGGER trigger_generate_estoque_sku
  BEFORE INSERT ON public.estoque
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_estoque_sku();

-- Preencher SKUs nos itens existentes
DO $$
DECLARE
  item RECORD;
  counter INTEGER := 1;
BEGIN
  FOR item IN 
    SELECT id FROM public.estoque 
    WHERE sku IS NULL 
    ORDER BY created_at ASC
  LOOP
    UPDATE public.estoque 
    SET sku = 'ep' || LPAD(counter::TEXT, 3, '0')
    WHERE id = item.id;
    counter := counter + 1;
  END LOOP;
END $$;