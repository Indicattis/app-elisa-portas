-- =====================================================
-- Migration: Corrigir criação de ordem de qualidade
-- Descrição: Criar linhas_ordens para cada linha do pedido
-- =====================================================

-- Drop da função antiga
DROP FUNCTION IF EXISTS public.criar_ordem_qualidade(uuid);

-- Recriar função com nova lógica
CREATE OR REPLACE FUNCTION public.criar_ordem_qualidade(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_numero_ordem TEXT;
  v_ordem_id uuid;
  v_linha RECORD;
  v_linhas_count INTEGER;
BEGIN
  RAISE LOG '[criar_ordem_qualidade] Iniciando para pedido: %', p_pedido_id;
  
  -- Verificar se já existe ordem de qualidade para este pedido
  IF EXISTS(SELECT 1 FROM ordens_qualidade WHERE pedido_id = p_pedido_id) THEN
    RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- Verificar se há linhas no pedido
  SELECT COUNT(*) INTO v_linhas_count FROM pedido_linhas WHERE pedido_id = p_pedido_id;
  
  IF v_linhas_count = 0 THEN
    RAISE LOG '[criar_ordem_qualidade] Nenhuma linha encontrada para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  RAISE LOG '[criar_ordem_qualidade] Encontradas % linhas para pedido: %', v_linhas_count, p_pedido_id;
  
  -- Gerar número da ordem
  SELECT gerar_numero_ordem('qualidade') INTO v_numero_ordem;
  
  -- Criar ordem de qualidade
  INSERT INTO ordens_qualidade (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade criada: % com número: %', v_ordem_id, v_numero_ordem;
  
  -- Criar uma linha na ordem de qualidade para CADA linha do pedido
  FOR v_linha IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id ORDER BY ordem
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'qualidade',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
      false
    );
    
    RAISE LOG '[criar_ordem_qualidade] Linha de qualidade criada para item: %', v_linha.nome_produto;
  END LOOP;
  
  RAISE LOG '[criar_ordem_qualidade] Finalizado para pedido: %', p_pedido_id;
END;
$function$;