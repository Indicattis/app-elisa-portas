
-- Atualizar leads com status 4 (Concluído) para status 5 (Vendido)
-- e adicionar novo status 6 (Cancelado)
UPDATE public.elisaportas_leads 
SET status_atendimento = 5 
WHERE status_atendimento = 4;

-- Atualizar função cancel_lead_attendance para usar status 6 (Cancelado)
CREATE OR REPLACE FUNCTION public.cancel_lead_attendance(lead_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o usuário é o atendente do lead ou é admin
  IF NOT (is_admin() OR is_lead_attendant(lead_uuid)) THEN
    RETURN false;
  END IF;

  -- Atualizar status para cancelado (6) e desvincular atendente
  UPDATE public.elisaportas_leads 
  SET status_atendimento = 6,
      atendente_id = NULL,
      data_inicio_atendimento = NULL,
      updated_at = now()
  WHERE id = lead_uuid;

  -- Registrar no histórico
  INSERT INTO public.lead_atendimento_historico (
    lead_id,
    atendente_id,
    acao,
    status_anterior,
    status_novo
  ) VALUES (
    lead_uuid,
    auth.uid(),
    'cancelou_atendimento',
    2, -- Em andamento
    6  -- Cancelado
  );

  RETURN true;
END;
$function$;

-- Atualizar função finalizar_venda para usar status 5 (Vendido)
CREATE OR REPLACE FUNCTION public.finalizar_venda(lead_uuid uuid, valor_venda numeric, forma_pagamento text DEFAULT NULL::text, observacoes_venda text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar se o usuário é o atendente do lead ou é admin
  IF NOT (is_admin() OR is_lead_attendant(lead_uuid)) THEN
    RETURN false;
  END IF;

  -- Atualizar status do lead para vendido (5)
  UPDATE public.elisaportas_leads 
  SET status_atendimento = 5,
      data_conclusao_atendimento = now(),
      updated_at = now()
  WHERE id = lead_uuid;

  -- Criar registro de venda
  INSERT INTO public.vendas (
    lead_id,
    atendente_id,
    valor_venda,
    forma_pagamento,
    observacoes_venda
  ) VALUES (
    lead_uuid,
    auth.uid(),
    valor_venda,
    forma_pagamento,
    observacoes_venda
  );

  -- Registrar no histórico
  INSERT INTO public.lead_atendimento_historico (
    lead_id,
    atendente_id,
    acao,
    status_anterior,
    status_novo
  ) VALUES (
    lead_uuid,
    auth.uid(),
    'finalizou_venda',
    2, -- Em andamento
    5  -- Vendido
  );

  RETURN true;
END;
$function$;
