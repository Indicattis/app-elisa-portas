-- Adicionar coluna canal_aquisicao_id à tabela orcamentos se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orcamentos' AND column_name = 'canal_aquisicao_id') THEN
        ALTER TABLE public.orcamentos ADD COLUMN canal_aquisicao_id uuid REFERENCES public.canais_aquisicao(id);
    END IF;
END $$;

-- Garantir que a coluna canal_aquisicao_id existe na tabela requisicoes_venda
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requisicoes_venda' AND column_name = 'canal_aquisicao_id') THEN
        ALTER TABLE public.requisicoes_venda ADD COLUMN canal_aquisicao_id uuid REFERENCES public.canais_aquisicao(id);
    END IF;
END $$;

-- Atualizar função criar_requisicao_venda para funcionar corretamente
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
$function$;