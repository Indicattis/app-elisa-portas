-- Atualizar função criar_requisicao_venda para incluir canal_aquisicao_id
CREATE OR REPLACE FUNCTION public.criar_requisicao_venda(orcamento_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requisicao_id uuid;
  orcamento_atendente_id uuid;
  orcamento_canal_id uuid;
BEGIN
  -- Buscar atendente e canal do orçamento
  SELECT atendente_id, canal_aquisicao_id 
  INTO orcamento_atendente_id, orcamento_canal_id
  FROM public.orcamentos 
  WHERE id = orcamento_uuid;
  
  -- Verificar se o usuário tem permissão (deve ser o atendente do orçamento ou admin)
  IF NOT (is_admin() OR (orcamento_atendente_id IS NOT NULL AND orcamento_atendente_id = auth.uid())) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para criar requisição de venda';
  END IF;

  -- Criar requisição de venda
  INSERT INTO public.requisicoes_venda (
    orcamento_id,
    solicitante_id,
    canal_aquisicao_id
  ) VALUES (
    orcamento_uuid,
    auth.uid(),
    orcamento_canal_id
  ) RETURNING id INTO requisicao_id;

  RETURN requisicao_id;
END;
$function$