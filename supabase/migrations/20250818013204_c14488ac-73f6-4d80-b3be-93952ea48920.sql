-- Atualizar função criar_requisicao_venda para incluir o e-mail do cliente
CREATE OR REPLACE FUNCTION public.criar_requisicao_venda(orcamento_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requisicao_id uuid;
  orcamento_atendente_id uuid;
  orcamento_canal_id uuid;
  lead_canal_id uuid;
  canal_final_id uuid;
  orcamento_cliente_email text;
BEGIN
  -- Buscar dados do orçamento e lead associado
  SELECT 
    o.atendente_id, 
    o.canal_aquisicao_id,
    o.cliente_email,
    l.canal_aquisicao_id
  INTO 
    orcamento_atendente_id, 
    orcamento_canal_id,
    orcamento_cliente_email,
    lead_canal_id
  FROM public.orcamentos o
  LEFT JOIN public.elisaportas_leads l ON o.lead_id = l.id
  WHERE o.id = orcamento_uuid;
  
  -- Verificar se o usuário tem permissão
  IF NOT (is_admin() OR (orcamento_atendente_id IS NOT NULL AND orcamento_atendente_id = auth.uid())) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para criar requisição de venda';
  END IF;

  -- Determinar qual canal usar (prioridade: orçamento > lead > null)
  canal_final_id := COALESCE(orcamento_canal_id, lead_canal_id);

  -- Criar requisição de venda
  INSERT INTO public.requisicoes_venda (
    orcamento_id,
    solicitante_id,
    canal_aquisicao_id,
    cliente_email
  ) VALUES (
    orcamento_uuid,
    auth.uid(),
    canal_final_id,
    orcamento_cliente_email
  ) RETURNING id INTO requisicao_id;

  RETURN requisicao_id;
END;
$$;