-- Corrigir função sync_data_carregamento_from_instalacao
-- O campo correto é data_carregamento, não data_instalacao
DROP FUNCTION IF EXISTS public.sync_data_carregamento_from_instalacao() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_data_carregamento_from_instalacao()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Usar data_carregamento em vez de data_instalacao
  IF NEW.data_carregamento IS DISTINCT FROM OLD.data_carregamento 
     AND NEW.pedido_id IS NOT NULL THEN
    
    UPDATE pedidos_producao
    SET data_carregamento = NEW.data_carregamento,
        updated_at = NOW()
    WHERE id = NEW.pedido_id;
    
    RAISE LOG '[sync] Data carregamento atualizada para pedido %: %', 
      NEW.pedido_id, NEW.data_carregamento;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS sync_data_carregamento_trigger ON ordens_carregamento;

CREATE TRIGGER sync_data_carregamento_trigger
  BEFORE UPDATE ON ordens_carregamento
  FOR EACH ROW
  EXECUTE FUNCTION sync_data_carregamento_from_instalacao();

-- Corrigir trigger de geocodificação
-- A tabela ordens_carregamento não tem campos cidade e estado diretamente
-- Esses campos vêm da venda relacionada
DROP TRIGGER IF EXISTS trigger_geocode_instalacao_on_insert ON ordens_carregamento;
DROP FUNCTION IF EXISTS public.trigger_geocode_instalacao() CASCADE;

-- Criar função melhorada que busca dados da venda
CREATE OR REPLACE FUNCTION public.trigger_geocode_ordem_carregamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_cidade text;
  v_estado text;
BEGIN
  -- Só fazer geocodificação se latitude ainda não foi definida e tem venda_id
  IF NEW.latitude IS NULL AND NEW.venda_id IS NOT NULL THEN
    -- Buscar cidade e estado da venda relacionada
    SELECT cidade, estado INTO v_cidade, v_estado
    FROM vendas
    WHERE id = NEW.venda_id;
    
    -- Se encontrou dados, fazer a chamada de geocodificação
    IF v_cidade IS NOT NULL AND v_estado IS NOT NULL THEN
      BEGIN
        PERFORM
          net.http_post(
            url := 'https://zddnvwqhfcqspmxscwyy.supabase.co/functions/v1/geocode-instalacao',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
            ),
            body := jsonb_build_object(
              'id', NEW.id::text,
              'cidade', v_cidade,
              'estado', v_estado
            )
          );
      EXCEPTION WHEN OTHERS THEN
        -- Silenciar erros de geocodificação
        NULL;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar trigger de geocodificação
CREATE TRIGGER trigger_geocode_ordem_carregamento_on_insert
  AFTER INSERT ON ordens_carregamento
  FOR EACH ROW
  EXECUTE FUNCTION trigger_geocode_ordem_carregamento();