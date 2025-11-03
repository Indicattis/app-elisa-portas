-- Remove colunas tamanho e categoria da tabela instalacoes_cadastradas
ALTER TABLE instalacoes_cadastradas DROP COLUMN IF EXISTS tamanho;
ALTER TABLE instalacoes_cadastradas DROP COLUMN IF EXISTS categoria;

-- Criar função para geocodificar instalações automaticamente
CREATE OR REPLACE FUNCTION trigger_geocode_instalacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a instalação foi criada a partir de um pedido e ainda não foi geocodificada
  IF NEW.pedido_id IS NOT NULL AND NEW.latitude IS NULL THEN
    -- Chamar edge function de forma assíncrona usando pg_net (se disponível)
    -- Isso tentará geocodificar, mas não bloqueará a inserção se falhar
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
            'cidade', NEW.cidade,
            'estado', NEW.estado
          )
        );
    EXCEPTION WHEN OTHERS THEN
      -- Se pg_net não estiver disponível ou houver erro, apenas continuar
      -- A geocodificação pode ser feita manualmente depois
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS geocode_instalacao_trigger ON instalacoes_cadastradas;
CREATE TRIGGER geocode_instalacao_trigger
  AFTER INSERT ON instalacoes_cadastradas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_geocode_instalacao();