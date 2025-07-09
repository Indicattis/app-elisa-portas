
-- Criar função para gerenciar etiquetas automaticamente
CREATE OR REPLACE FUNCTION public.manage_lead_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  current_tags jsonb;
  new_tags jsonb;
BEGIN
  -- Para novos leads (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Definir etiqueta padrão: Atendimento (Primeiro contato)
    NEW.observacoes = COALESCE(NEW.observacoes, '{}');
    
    -- Parse das observações ou criar objeto vazio se não existir
    BEGIN
      current_tags = NEW.observacoes::jsonb;
    EXCEPTION WHEN OTHERS THEN
      current_tags = '{}'::jsonb;
    END;
    
    -- Adicionar etiqueta padrão
    new_tags = current_tags || jsonb_build_object('tags', jsonb_build_array('atendimento_primeiro'));
    NEW.observacoes = new_tags::text;
    
    RETURN NEW;
  END IF;
  
  -- Para atualizações (UPDATE)
  IF TG_OP = 'UPDATE' THEN
    -- Se o status mudou para vendido (5), definir etiqueta como "Cliente fechado"
    IF OLD.status_atendimento != 5 AND NEW.status_atendimento = 5 THEN
      -- Parse das observações atuais
      BEGIN
        current_tags = COALESCE(NEW.observacoes, '{}')::jsonb;
      EXCEPTION WHEN OTHERS THEN
        current_tags = '{}'::jsonb;
      END;
      
      -- Definir etiqueta como "Cliente fechado"
      new_tags = current_tags || jsonb_build_object('tags', jsonb_build_array('cliente_fechado'));
      NEW.observacoes = new_tags::text;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Criar trigger para novos leads
DROP TRIGGER IF EXISTS trigger_manage_lead_tags_insert ON public.elisaportas_leads;
CREATE TRIGGER trigger_manage_lead_tags_insert
  BEFORE INSERT ON public.elisaportas_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_lead_tags();

-- Criar trigger para atualizações de leads
DROP TRIGGER IF EXISTS trigger_manage_lead_tags_update ON public.elisaportas_leads;
CREATE TRIGGER trigger_manage_lead_tags_update
  BEFORE UPDATE ON public.elisaportas_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_lead_tags();

-- Atualizar leads existentes sem etiquetas para ter a etiqueta padrão
UPDATE public.elisaportas_leads 
SET observacoes = CASE 
  WHEN observacoes IS NULL OR observacoes = '' THEN 
    '{"tags": ["atendimento_primeiro"]}'
  WHEN observacoes::jsonb ? 'tags' THEN 
    observacoes
  ELSE 
    (observacoes::jsonb || '{"tags": ["atendimento_primeiro"]}'::jsonb)::text
END
WHERE (observacoes IS NULL OR observacoes = '' OR NOT (observacoes::jsonb ? 'tags'));

-- Atualizar leads vendidos para ter a etiqueta "Cliente fechado"
UPDATE public.elisaportas_leads 
SET observacoes = CASE 
  WHEN observacoes IS NULL OR observacoes = '' THEN 
    '{"tags": ["cliente_fechado"]}'
  ELSE 
    (observacoes::jsonb || '{"tags": ["cliente_fechado"]}'::jsonb)::text
END
WHERE status_atendimento = 5;
