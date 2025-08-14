-- Corrigir o serviço de criação de orçamentos para calcular valor_produto corretamente
-- e garantir que o canal de aquisição seja salvo

-- 1. Função para calcular valor dos produtos
CREATE OR REPLACE FUNCTION public.calcular_valor_produto_orcamento(orcamento_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  valor_produtos numeric := 0;
BEGIN
  SELECT COALESCE(SUM(valor), 0)
  INTO valor_produtos
  FROM public.orcamento_produtos
  WHERE orcamento_id = orcamento_uuid;
  
  RETURN valor_produtos;
END;
$function$;

-- 2. Trigger para atualizar valor_produto automaticamente quando produtos são inseridos/atualizados
CREATE OR REPLACE FUNCTION public.atualizar_valor_produto_orcamento()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Atualizar o valor_produto no orçamento
  UPDATE public.orcamentos 
  SET valor_produto = public.calcular_valor_produto_orcamento(COALESCE(NEW.orcamento_id, OLD.orcamento_id))
  WHERE id = COALESCE(NEW.orcamento_id, OLD.orcamento_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. Criar triggers para produtos
DROP TRIGGER IF EXISTS trigger_atualizar_valor_produto ON public.orcamento_produtos;
CREATE TRIGGER trigger_atualizar_valor_produto
  AFTER INSERT OR UPDATE OR DELETE ON public.orcamento_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_valor_produto_orcamento();

-- 4. Atualizar orçamentos existentes com valor_produto correto
UPDATE public.orcamentos 
SET valor_produto = public.calcular_valor_produto_orcamento(id)
WHERE valor_produto = 0 OR valor_produto IS NULL;

-- 5. Melhorar a função de criação de requisição para buscar canal do lead se não houver no orçamento
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
  lead_canal_id uuid;
  canal_final_id uuid;
BEGIN
  -- Buscar dados do orçamento e lead associado
  SELECT 
    o.atendente_id, 
    o.canal_aquisicao_id,
    l.canal_aquisicao_id
  INTO 
    orcamento_atendente_id, 
    orcamento_canal_id,
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
    canal_aquisicao_id
  ) VALUES (
    orcamento_uuid,
    auth.uid(),
    canal_final_id
  ) RETURNING id INTO requisicao_id;

  RETURN requisicao_id;
END;
$function$;