-- Renomear tabela principal
ALTER TABLE public.portas_vendas RENAME TO produtos_vendas;

-- Dropar triggers antigos primeiro
DROP TRIGGER IF EXISTS trigger_calcular_valores_porta ON public.produtos_vendas;
DROP TRIGGER IF EXISTS trigger_portas_vendas_updated_at ON public.produtos_vendas;

-- Agora dropar a função antiga
DROP FUNCTION IF EXISTS public.calcular_valores_porta();

-- Criar nova função com nome atualizado
CREATE OR REPLACE FUNCTION public.calcular_valores_produto()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  valor_base numeric;
  desconto_aplicado numeric;
BEGIN
  -- Calcular valor base antes do desconto
  valor_base := (
    NEW.valor_produto + NEW.valor_pintura + NEW.valor_instalacao
  ) * NEW.quantidade;
  
  -- Aplicar desconto conforme o tipo
  IF NEW.tipo_desconto = 'valor' THEN
    desconto_aplicado := COALESCE(NEW.desconto_valor, 0);
  ELSE
    desconto_aplicado := valor_base * (COALESCE(NEW.desconto_percentual, 0)::numeric / 100);
  END IF;
  
  NEW.valor_total_sem_frete := valor_base - desconto_aplicado;
  NEW.valor_total := NEW.valor_total_sem_frete + (NEW.valor_frete * NEW.quantidade);
  
  RETURN NEW;
END;
$function$;

-- Criar novos triggers
CREATE TRIGGER trigger_produtos_vendas_calcular_valores
BEFORE INSERT OR UPDATE ON public.produtos_vendas
FOR EACH ROW
EXECUTE FUNCTION public.calcular_valores_produto();

CREATE TRIGGER trigger_produtos_vendas_updated_at
BEFORE UPDATE ON public.produtos_vendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar função recalcular_totais_venda
CREATE OR REPLACE FUNCTION public.recalcular_totais_venda()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  venda_uuid uuid;
  total_produtos numeric;
  total_frete numeric;
BEGIN
  venda_uuid := COALESCE(NEW.venda_id, OLD.venda_id);
  
  -- Calcular soma dos valores dos produtos (sem frete)
  SELECT COALESCE(SUM(valor_total), 0) INTO total_produtos
  FROM produtos_vendas 
  WHERE venda_id = venda_uuid;
  
  -- Buscar valor do frete da venda principal
  SELECT COALESCE(valor_frete, 0) INTO total_frete
  FROM vendas
  WHERE id = venda_uuid;
  
  -- Atualizar totais da venda
  UPDATE vendas
  SET 
    valor_venda = total_produtos + total_frete,
    lucro_total = COALESCE((
      SELECT SUM(lucro_item) 
      FROM produtos_vendas 
      WHERE venda_id = venda_uuid
    ), 0),
    valor_instalacao = COALESCE((
      SELECT SUM(valor_instalacao) 
      FROM produtos_vendas 
      WHERE venda_id = venda_uuid
    ), 0)
  WHERE id = venda_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recriar trigger para a tabela renomeada
DROP TRIGGER IF EXISTS trigger_recalcular_totais_venda ON public.produtos_vendas;
CREATE TRIGGER trigger_recalcular_totais_venda
AFTER INSERT OR UPDATE OR DELETE ON public.produtos_vendas
FOR EACH ROW
EXECUTE FUNCTION public.recalcular_totais_venda();

-- Atualizar função recalcular_valor_venda_com_frete
CREATE OR REPLACE FUNCTION public.recalcular_valor_venda_com_frete()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  total_produtos numeric;
BEGIN
  -- Calcular soma dos valores dos produtos (sem frete)
  SELECT COALESCE(SUM(valor_total), 0) INTO total_produtos
  FROM produtos_vendas 
  WHERE venda_id = NEW.id;
  
  -- Atualizar valor_venda incluindo o frete
  NEW.valor_venda := total_produtos + COALESCE(NEW.valor_frete, 0);
  
  RETURN NEW;
END;
$function$;

-- Atualizar política RLS
DROP POLICY IF EXISTS "Authenticated users can manage portas_vendas" ON public.produtos_vendas;
CREATE POLICY "Authenticated users can manage produtos_vendas"
ON public.produtos_vendas
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Comentário para documentação
COMMENT ON TABLE public.produtos_vendas IS 'Tabela de produtos de vendas (anteriormente portas_vendas)';