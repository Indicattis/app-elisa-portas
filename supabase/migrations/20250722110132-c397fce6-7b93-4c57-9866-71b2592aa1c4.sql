
-- Primeiro, vamos verificar se a tabela ordens_producao já tem os campos necessários
-- e adicionar os que estão faltando

-- Adicionar colunas para rastrear o status de cada tipo de ordem
ALTER TABLE public.ordens_producao 
ADD COLUMN IF NOT EXISTS ordem_perfiladeira_concluida boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ordem_soldagem_concluida boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ordem_separacao_concluida boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ordem_pintura_concluida boolean DEFAULT false;

-- Criar um trigger para atualizar automaticamente o status do pedido
-- quando todas as ordens estiverem concluídas
CREATE OR REPLACE FUNCTION public.atualizar_status_pedido_completo()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  todas_ordens_concluidas boolean;
BEGIN
  -- Verificar se todas as ordens do pedido estão concluídas
  SELECT 
    COALESCE(bool_and(
      ordem_perfiladeira_concluida AND 
      ordem_soldagem_concluida AND 
      ordem_separacao_concluida AND 
      ordem_pintura_concluida
    ), false)
  INTO todas_ordens_concluidas
  FROM public.ordens_producao
  WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  
  -- Se todas as ordens estão concluídas, atualizar status do pedido
  IF todas_ordens_concluidas THEN
    UPDATE public.pedidos_producao
    SET status = 'para_instalacao',
        updated_at = now()
    WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  ELSE
    -- Se nem todas estão concluídas, manter como em_andamento se havia progresso
    UPDATE public.pedidos_producao
    SET status = CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.ordens_producao 
        WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id)
        AND (ordem_perfiladeira_concluida OR ordem_soldagem_concluida OR 
             ordem_separacao_concluida OR ordem_pintura_concluida)
      ) THEN 'em_andamento'
      ELSE 'pendente'
    END,
    updated_at = now()
    WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_atualizar_status_pedido_completo ON public.ordens_producao;
CREATE TRIGGER trigger_atualizar_status_pedido_completo
  AFTER UPDATE ON public.ordens_producao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_status_pedido_completo();

-- Criar ordens de produção padrão para cada pedido existente (se não existirem)
INSERT INTO public.ordens_producao (pedido_id, tipo_ordem, status, created_by)
SELECT 
  p.id,
  'perfiladeira',
  'pendente',
  p.created_by
FROM public.pedidos_producao p
WHERE NOT EXISTS (
  SELECT 1 FROM public.ordens_producao o 
  WHERE o.pedido_id = p.id AND o.tipo_ordem = 'perfiladeira'
);

INSERT INTO public.ordens_producao (pedido_id, tipo_ordem, status, created_by)
SELECT 
  p.id,
  'soldagem',
  'pendente',
  p.created_by
FROM public.pedidos_producao p
WHERE NOT EXISTS (
  SELECT 1 FROM public.ordens_producao o 
  WHERE o.pedido_id = p.id AND o.tipo_ordem = 'soldagem'
);

INSERT INTO public.ordens_producao (pedido_id, tipo_ordem, status, created_by)
SELECT 
  p.id,
  'separacao',
  'pendente',
  p.created_by
FROM public.pedidos_producao p
WHERE NOT EXISTS (
  SELECT 1 FROM public.ordens_producao o 
  WHERE o.pedido_id = p.id AND o.tipo_ordem = 'separacao'
);

INSERT INTO public.ordens_producao (pedido_id, tipo_ordem, status, created_by)
SELECT 
  p.id,
  'pintura',
  'pendente',
  p.created_by
FROM public.pedidos_producao p
WHERE NOT EXISTS (
  SELECT 1 FROM public.ordens_producao o 
  WHERE o.pedido_id = p.id AND o.tipo_ordem = 'pintura'
);
