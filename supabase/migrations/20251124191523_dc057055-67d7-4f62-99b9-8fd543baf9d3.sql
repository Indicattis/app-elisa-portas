-- ETAPA 1: Adicionar novas colunas à tabela instalacoes

-- Campos de vínculo e controle
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES pedidos_producao(id);
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS telefone_cliente text;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente_producao';
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS tipo_instalacao tipo_instalacao_enum;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS responsavel_instalacao_nome text;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS data_producao date;

-- Campos de conclusão
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS instalacao_concluida boolean DEFAULT false;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS instalacao_concluida_em timestamp with time zone;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS instalacao_concluida_por uuid;

-- Campos de geolocalização
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS last_geocoded_at timestamp with time zone;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS geocode_precision text;

-- Campos de correção
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS justificativa_correcao text;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS alterado_para_correcao_em timestamp with time zone;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS alterado_para_correcao_por uuid REFERENCES admin_users(user_id);

-- ETAPA 2: Remover constraint NOT NULL temporariamente e renomear colunas
ALTER TABLE instalacoes ALTER COLUMN data DROP NOT NULL;
ALTER TABLE instalacoes RENAME COLUMN data TO data_instalacao;
ALTER TABLE instalacoes RENAME COLUMN id_venda TO venda_id;
ALTER TABLE instalacoes RENAME COLUMN equipe_id TO responsavel_instalacao_id;

-- Atualizar registros com data NULL para hoje
UPDATE instalacoes SET data_instalacao = CURRENT_DATE WHERE data_instalacao IS NULL;

-- Restaurar constraint NOT NULL
ALTER TABLE instalacoes ALTER COLUMN data_instalacao SET NOT NULL;

-- ETAPA 3: Migrar dados de instalacoes_cadastradas para instalacoes
INSERT INTO instalacoes (
  id, nome_cliente, telefone_cliente, cidade, estado,
  data_instalacao, venda_id, pedido_id,
  responsavel_instalacao_id, responsavel_instalacao_nome,
  status, tipo_instalacao, data_producao,
  instalacao_concluida, instalacao_concluida_em, instalacao_concluida_por,
  latitude, longitude, last_geocoded_at, geocode_precision,
  justificativa_correcao, alterado_para_correcao_em, alterado_para_correcao_por,
  created_at, updated_at, created_by,
  hora, produto, endereco, cep, descricao
)
SELECT 
  ic.id, ic.nome_cliente, ic.telefone_cliente, ic.cidade, ic.estado,
  COALESCE(ic.data_instalacao, CURRENT_DATE), ic.venda_id, ic.pedido_id,
  ic.responsavel_instalacao_id, ic.responsavel_instalacao_nome,
  ic.status, ic.tipo_instalacao, ic.data_producao,
  ic.instalacao_concluida, ic.instalacao_concluida_em, ic.instalacao_concluida_por,
  ic.latitude, ic.longitude, ic.last_geocoded_at, ic.geocode_precision,
  ic.justificativa_correcao, ic.alterado_para_correcao_em, ic.alterado_para_correcao_por,
  ic.created_at, ic.updated_at, ic.created_by,
  '08:00'::time,
  '',
  NULL, NULL, NULL
FROM instalacoes_cadastradas ic
WHERE ic.id NOT IN (SELECT id FROM instalacoes)
ON CONFLICT (id) DO NOTHING;

-- ETAPA 4: Atualizar triggers

CREATE OR REPLACE FUNCTION public.trigger_geocode_instalacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.pedido_id IS NOT NULL AND NEW.latitude IS NULL THEN
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
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_instalacao_status_from_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM instalacoes WHERE pedido_id = NEW.id) THEN
    UPDATE instalacoes 
    SET status = map_etapa_to_instalacao_status(NEW.etapa_atual)
    WHERE pedido_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_instalacao_status_from_pedido_etapa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  ultima_etapa TEXT;
BEGIN
  SELECT etapa INTO ultima_etapa
  FROM pedidos_etapas
  WHERE pedido_id = NEW.pedido_id
  ORDER BY 
    CASE 
      WHEN data_saida IS NOT NULL THEN data_saida
      ELSE data_entrada
    END DESC
  LIMIT 1;
  
  UPDATE instalacoes
  SET 
    status = CASE
      WHEN ultima_etapa IN ('aguardando_instalacao', 'aguardando_coleta') 
        THEN 'pronta_fabrica'
      WHEN ultima_etapa = 'finalizado' AND instalacao_concluida = false
        THEN 'pronta_fabrica'
      WHEN ultima_etapa IN ('aberto', 'em_producao', 'inspecao_qualidade', 'aguardando_pintura')
        THEN 'pendente_producao'
      ELSE status
    END,
    updated_at = now()
  WHERE 
    pedido_id = NEW.pedido_id 
    AND instalacao_concluida = false
    AND status != 'finalizada';
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_data_carregamento_from_instalacao()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.data_instalacao IS DISTINCT FROM OLD.data_instalacao 
     AND NEW.pedido_id IS NOT NULL THEN
    
    UPDATE pedidos_producao
    SET data_carregamento = NEW.data_instalacao,
        updated_at = NOW()
    WHERE id = NEW.pedido_id;
    
    RAISE LOG '[sync] Data carregamento atualizada para pedido %: %', 
      NEW.pedido_id, NEW.data_instalacao;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_geocode_instalacao_on_insert ON instalacoes;
CREATE TRIGGER trigger_geocode_instalacao_on_insert
  AFTER INSERT ON instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_geocode_instalacao();

DROP TRIGGER IF EXISTS sync_data_carregamento_trigger ON instalacoes;
CREATE TRIGGER sync_data_carregamento_trigger
  AFTER UPDATE OF data_instalacao ON instalacoes
  FOR EACH ROW
  EXECUTE FUNCTION sync_data_carregamento_from_instalacao();