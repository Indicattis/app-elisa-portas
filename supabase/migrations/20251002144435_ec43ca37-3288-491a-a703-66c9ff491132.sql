-- Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_inserir_contador_vendas ON public.vendas;

-- Recriar a função com logs para debug
CREATE OR REPLACE FUNCTION public.inserir_contador_vendas_automatico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log para debug
  RAISE LOG 'Inserindo contador vendas - data: %, atendente_id: %, valor: %', 
    DATE(NEW.data_venda), NEW.atendente_id, NEW.valor_venda;
  
  -- Inserir ou atualizar contador de vendas
  INSERT INTO public.contador_vendas_dias (
    data,
    atendente_id,
    valor,
    numero_vendas,
    created_by
  )
  VALUES (
    DATE(NEW.data_venda),
    NEW.atendente_id,
    NEW.valor_venda,
    1,
    NEW.atendente_id
  )
  ON CONFLICT (data, atendente_id) 
  DO UPDATE SET
    valor = contador_vendas_dias.valor + EXCLUDED.valor,
    numero_vendas = contador_vendas_dias.numero_vendas + 1,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro no trigger contador vendas: %', SQLERRM;
    RAISE;
END;
$function$;

-- Recriar trigger
CREATE TRIGGER trigger_inserir_contador_vendas
  AFTER INSERT ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION inserir_contador_vendas_automatico();