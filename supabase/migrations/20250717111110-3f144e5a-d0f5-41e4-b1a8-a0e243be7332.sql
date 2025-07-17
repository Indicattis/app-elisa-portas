-- Função para atualizar status do pedido baseado nas ordens
CREATE OR REPLACE FUNCTION public.atualizar_status_pedido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  total_ordens integer;
  ordens_concluidas integer;
BEGIN
  -- Contar total de ordens do pedido
  SELECT COUNT(*) INTO total_ordens
  FROM public.ordens_producao
  WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  
  -- Contar ordens concluídas
  SELECT COUNT(*) INTO ordens_concluidas
  FROM public.ordens_producao
  WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id)
  AND status = 'concluido';
  
  -- Atualizar status do pedido
  UPDATE public.pedidos_producao
  SET status = CASE
    WHEN ordens_concluidas = total_ordens AND total_ordens > 0 THEN 'concluido'
    WHEN ordens_concluidas > 0 THEN 'em_andamento'
    ELSE 'pendente'
  END,
  updated_at = now()
  WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para atualizar status do pedido quando ordens mudarem
CREATE TRIGGER trigger_atualizar_status_pedido
AFTER INSERT OR UPDATE OR DELETE ON public.ordens_producao
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_status_pedido();