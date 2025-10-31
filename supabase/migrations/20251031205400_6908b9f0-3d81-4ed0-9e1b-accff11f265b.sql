-- =====================================================
-- Migration: Adicionar função para verificar ordem de qualidade concluída
-- Descrição: Verifica se todas as linhas da ordem de qualidade estão marcadas
-- =====================================================

CREATE OR REPLACE FUNCTION public.verificar_ordem_qualidade_concluida(p_pedido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_linhas INTEGER := 0;
  v_linhas_concluidas INTEGER := 0;
  v_ordem_id uuid;
BEGIN
  -- Buscar ID da ordem de qualidade
  SELECT id INTO v_ordem_id
  FROM ordens_qualidade
  WHERE pedido_id = p_pedido_id
  LIMIT 1;
  
  -- Se não existe ordem de qualidade, retorna false
  IF v_ordem_id IS NULL THEN
    RAISE LOG '[verificar_ordem_qualidade_concluida] Nenhuma ordem de qualidade encontrada para pedido: %', p_pedido_id;
    RETURN false;
  END IF;
  
  -- Contar total de linhas da ordem de qualidade
  SELECT COUNT(*) INTO v_total_linhas
  FROM linhas_ordens
  WHERE ordem_id = v_ordem_id AND tipo_ordem = 'qualidade';
  
  -- Contar linhas concluídas
  SELECT COUNT(*) INTO v_linhas_concluidas
  FROM linhas_ordens
  WHERE ordem_id = v_ordem_id AND tipo_ordem = 'qualidade' AND concluida = true;
  
  RAISE LOG '[verificar_ordem_qualidade_concluida] Pedido: %, Total linhas: %, Concluídas: %', 
    p_pedido_id, v_total_linhas, v_linhas_concluidas;
  
  -- Retorna true se todas as linhas estão concluídas e existe pelo menos uma linha
  RETURN v_total_linhas > 0 AND v_total_linhas = v_linhas_concluidas;
END;
$function$;