-- Corrigir função criar_requisicao_venda para lidar com lead_id nulo
CREATE OR REPLACE FUNCTION public.criar_requisicao_venda(
  lead_uuid uuid DEFAULT NULL, 
  orcamento_uuid uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  requisicao_id uuid;
  orcamento_lead_id uuid;
BEGIN
  -- Se não foi fornecido lead_uuid, buscar do orçamento
  IF lead_uuid IS NULL AND orcamento_uuid IS NOT NULL THEN
    SELECT lead_id INTO orcamento_lead_id 
    FROM public.orcamentos 
    WHERE id = orcamento_uuid;
    
    lead_uuid := orcamento_lead_id;
  END IF;

  -- Verificar se o usuário tem permissão
  IF NOT (is_admin() OR (lead_uuid IS NOT NULL AND is_lead_attendant(lead_uuid))) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para criar requisição de venda';
  END IF;

  -- Criar requisição de venda
  INSERT INTO public.requisicoes_venda (
    lead_id,
    orcamento_id,
    solicitante_id
  ) VALUES (
    lead_uuid,
    orcamento_uuid,
    auth.uid()
  ) RETURNING id INTO requisicao_id;

  RETURN requisicao_id;
END;
$function$;