-- =====================================================
-- Migration: Corrigir verificação de ordens concluídas
-- Descrição: Verificar apenas ordens que foram criadas
-- =====================================================

-- Drop da função antiga
DROP FUNCTION IF EXISTS public.verificar_ordens_pedido_concluidas(uuid);

-- Recriar função com nova lógica
CREATE OR REPLACE FUNCTION public.verificar_ordens_pedido_concluidas(p_pedido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_ordens INTEGER := 0;
  v_ordens_concluidas INTEGER := 0;
BEGIN
  -- Conta total de ordens criadas para o pedido (apenas as que existem)
  SELECT 
    (SELECT COUNT(*) FROM ordens_soldagem WHERE pedido_id = p_pedido_id) +
    (SELECT COUNT(*) FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id) +
    (SELECT COUNT(*) FROM ordens_separacao WHERE pedido_id = p_pedido_id)
  INTO v_total_ordens;
  
  -- Conta ordens concluídas
  SELECT 
    (SELECT COUNT(*) FROM ordens_soldagem WHERE pedido_id = p_pedido_id AND status = 'concluido') +
    (SELECT COUNT(*) FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id AND status = 'concluido') +
    (SELECT COUNT(*) FROM ordens_separacao WHERE pedido_id = p_pedido_id AND status = 'concluido')
  INTO v_ordens_concluidas;
  
  RAISE LOG '[verificar_ordens_pedido_concluidas] Pedido: %, Total: %, Concluídas: %', 
    p_pedido_id, v_total_ordens, v_ordens_concluidas;
  
  -- Retorna true se todas as ordens criadas estão concluídas e existe pelo menos uma ordem
  RETURN v_total_ordens > 0 AND v_total_ordens = v_ordens_concluidas;
END;
$function$;