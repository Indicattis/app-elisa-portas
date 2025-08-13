-- Remove lead_id from requisicoes_venda table and update function
ALTER TABLE public.requisicoes_venda DROP COLUMN IF EXISTS lead_id;

-- Update the criar_requisicao_venda function to work only with orcamento_id
CREATE OR REPLACE FUNCTION public.criar_requisicao_venda(orcamento_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requisicao_id uuid;
  orcamento_atendente_id uuid;
BEGIN
  -- Buscar atendente do orçamento
  SELECT atendente_id INTO orcamento_atendente_id 
  FROM public.orcamentos 
  WHERE id = orcamento_uuid;
  
  -- Verificar se o usuário tem permissão (deve ser o atendente do orçamento ou admin)
  IF NOT (is_admin() OR (orcamento_atendente_id IS NOT NULL AND orcamento_atendente_id = auth.uid())) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para criar requisição de venda';
  END IF;

  -- Criar requisição de venda
  INSERT INTO public.requisicoes_venda (
    orcamento_id,
    solicitante_id
  ) VALUES (
    orcamento_uuid,
    auth.uid()
  ) RETURNING id INTO requisicao_id;

  RETURN requisicao_id;
END;
$function$;

-- Update RLS policies for requisicoes_venda to work without lead references
DROP POLICY IF EXISTS "Gerentes e admins podem ver requisições" ON public.requisicoes_venda;
DROP POLICY IF EXISTS "Gerentes e admins podem atualizar requisições" ON public.requisicoes_venda;
DROP POLICY IF EXISTS "Usuários autenticados podem criar requisições" ON public.requisicoes_venda;

CREATE POLICY "Gerentes e admins podem ver requisições" 
ON public.requisicoes_venda 
FOR SELECT 
USING (
  is_admin() OR 
  (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  )) OR 
  (solicitante_id = auth.uid())
);

CREATE POLICY "Gerentes e admins podem atualizar requisições" 
ON public.requisicoes_venda 
FOR UPDATE 
USING (
  is_admin() OR 
  (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  ))
);

CREATE POLICY "Usuários autenticados podem criar requisições" 
ON public.requisicoes_venda 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  solicitante_id = auth.uid()
);