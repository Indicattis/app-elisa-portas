-- Corrigir função criar_ordem_qualidade para verificar itens elegíveis ANTES de criar a ordem
CREATE OR REPLACE FUNCTION public.criar_ordem_qualidade(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_ordem_id uuid;
  v_numero_ordem text;
  v_linha record;
  v_linhas_elegiveis INTEGER;
BEGIN
  -- Verificar se já existe ordem de qualidade para este pedido
  SELECT id INTO v_ordem_id 
  FROM ordens_qualidade 
  WHERE pedido_id = p_pedido_id AND historico = false;
  
  IF v_ordem_id IS NOT NULL THEN
    RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade já existe para pedido: %', p_pedido_id;
    RETURN;
  END IF;
  
  -- NOVA VERIFICAÇÃO: Contar itens elegíveis (solda/perfiladeira)
  SELECT COUNT(*) INTO v_linhas_elegiveis
  FROM pedido_linhas 
  WHERE pedido_id = p_pedido_id 
    AND categoria_linha IN ('solda', 'perfiladeira');
  
  -- Se não há itens elegíveis, não criar a ordem
  IF v_linhas_elegiveis = 0 THEN
    RAISE LOG '[criar_ordem_qualidade] Nenhum item elegível (solda/perfiladeira) para pedido: %. Ordem NÃO será criada.', p_pedido_id;
    RETURN;
  END IF;
  
  -- Gerar número da ordem
  SELECT gerar_numero_ordem('qualidade') INTO v_numero_ordem;
  
  -- Criar ordem de qualidade
  INSERT INTO ordens_qualidade (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;
  
  RAISE LOG '[criar_ordem_qualidade] Ordem de qualidade criada: % com número: %', v_ordem_id, v_numero_ordem;
  
  -- Criar linhas APENAS para itens de SOLDA e PERFILADEIRA
  FOR v_linha IN 
    SELECT * FROM pedido_linhas 
    WHERE pedido_id = p_pedido_id 
      AND categoria_linha IN ('solda', 'perfiladeira')
    ORDER BY ordem
  LOOP
    INSERT INTO linhas_ordens (
      pedido_id,
      ordem_id,
      tipo_ordem,
      item,
      quantidade,
      tamanho,
      concluida,
      estoque_id
    ) VALUES (
      p_pedido_id,
      v_ordem_id,
      'qualidade',
      COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
      COALESCE(v_linha.quantidade, 1),
      COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text),
      false,
      v_linha.estoque_id
    );
  END LOOP;
  
END;
$function$;

-- Limpar ordem de qualidade inválida OQU-2026-0082
DELETE FROM linhas_ordens 
WHERE ordem_id = '3f105cb6-b976-464b-b638-80fafb3c70db' 
  AND tipo_ordem = 'qualidade';

DELETE FROM ordens_qualidade 
WHERE id = '3f105cb6-b976-464b-b638-80fafb3c70db';