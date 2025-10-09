-- Atualizar trigger para incluir frete no valor_venda
CREATE OR REPLACE FUNCTION public.recalcular_totais_venda()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  venda_uuid uuid;
  total_portas numeric;
  total_frete numeric;
BEGIN
  venda_uuid := COALESCE(NEW.venda_id, OLD.venda_id);
  
  -- Calcular soma dos valores das portas (sem frete)
  SELECT COALESCE(SUM(valor_total), 0) INTO total_portas
  FROM portas_vendas 
  WHERE venda_id = venda_uuid;
  
  -- Buscar valor do frete da venda principal
  SELECT COALESCE(valor_frete, 0) INTO total_frete
  FROM vendas
  WHERE id = venda_uuid;
  
  -- Atualizar totais da venda
  UPDATE vendas
  SET 
    valor_venda = total_portas + total_frete,  -- Incluir frete no valor_venda
    lucro_total = COALESCE((
      SELECT SUM(lucro_item) 
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
$function$;

-- Também precisamos de uma trigger para quando o frete da venda for atualizado
CREATE OR REPLACE FUNCTION public.recalcular_valor_venda_com_frete()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  total_portas numeric;
BEGIN
  -- Calcular soma dos valores das portas (sem frete)
  SELECT COALESCE(SUM(valor_total), 0) INTO total_portas
  FROM portas_vendas 
  WHERE venda_id = NEW.id;
  
  -- Atualizar valor_venda incluindo o frete
  NEW.valor_venda := total_portas + COALESCE(NEW.valor_frete, 0);
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para quando a venda for atualizada
DROP TRIGGER IF EXISTS trigger_recalcular_valor_venda_com_frete ON vendas;
CREATE TRIGGER trigger_recalcular_valor_venda_com_frete
  BEFORE UPDATE OF valor_frete ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_valor_venda_com_frete();