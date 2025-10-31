-- =====================================================
-- Migration: Corrigir criação de ordens de produção
-- Descrição: Criar apenas ordens que têm linhas associadas
-- =====================================================

-- Drop da função antiga
DROP FUNCTION IF EXISTS public.criar_ordens_producao_automaticas(uuid);

-- Recriar função com nova lógica
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_numero_solda TEXT;
  v_numero_perfil TEXT;
  v_numero_sep TEXT;
  v_ordem_solda_id uuid;
  v_ordem_perfil_id uuid;
  v_ordem_sep_id uuid;
  v_linha RECORD;
  v_tem_soldagem BOOLEAN := FALSE;
  v_tem_perfiladeira BOOLEAN := FALSE;
  v_tem_separacao BOOLEAN := FALSE;
BEGIN
  RAISE LOG '[criar_ordens_producao_automaticas] Iniciando para pedido: %', p_pedido_id;
  
  -- Verificar quais tipos de ordem existem nas linhas do pedido
  SELECT 
    EXISTS(SELECT 1 FROM pedido_linhas WHERE pedido_id = p_pedido_id AND (tipo_ordem = 'soldagem' OR tipo_ordem IS NULL)),
    EXISTS(SELECT 1 FROM pedido_linhas WHERE pedido_id = p_pedido_id AND tipo_ordem = 'perfiladeira'),
    EXISTS(SELECT 1 FROM pedido_linhas WHERE pedido_id = p_pedido_id AND tipo_ordem = 'separacao')
  INTO v_tem_soldagem, v_tem_perfiladeira, v_tem_separacao;
  
  RAISE LOG '[criar_ordens_producao_automaticas] Tem soldagem: %, perfiladeira: %, separacao: %', 
    v_tem_soldagem, v_tem_perfiladeira, v_tem_separacao;
  
  -- Criar ordem de soldagem apenas se houver linhas
  IF v_tem_soldagem THEN
    SELECT gerar_numero_ordem('soldagem') INTO v_numero_solda;
    INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status)
    VALUES (p_pedido_id, v_numero_solda, 'pendente')
    RETURNING id INTO v_ordem_solda_id;
    RAISE LOG '[criar_ordens_producao_automaticas] Ordem de soldagem criada: %', v_ordem_solda_id;
  END IF;
  
  -- Criar ordem de perfiladeira apenas se houver linhas
  IF v_tem_perfiladeira THEN
    SELECT gerar_numero_ordem('perfiladeira') INTO v_numero_perfil;
    INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
    VALUES (p_pedido_id, v_numero_perfil, 'pendente')
    RETURNING id INTO v_ordem_perfil_id;
    RAISE LOG '[criar_ordens_producao_automaticas] Ordem de perfiladeira criada: %', v_ordem_perfil_id;
  END IF;
  
  -- Criar ordem de separação apenas se houver linhas
  IF v_tem_separacao THEN
    SELECT gerar_numero_ordem('separacao') INTO v_numero_sep;
    INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
    VALUES (p_pedido_id, v_numero_sep, 'pendente')
    RETURNING id INTO v_ordem_sep_id;
    RAISE LOG '[criar_ordens_producao_automaticas] Ordem de separacao criada: %', v_ordem_sep_id;
  END IF;
  
  -- Criar linhas de cada ordem baseado nas linhas do pedido e seu tipo_ordem
  FOR v_linha IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id
  LOOP
    -- Linhas de soldagem (incluindo NULL que vai para soldagem por padrão)
    IF (v_linha.tipo_ordem = 'soldagem' OR v_linha.tipo_ordem IS NULL) AND v_ordem_solda_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        tipo_ordem,
        item,
        quantidade,
        tamanho
      ) VALUES (
        p_pedido_id,
        v_ordem_solda_id,
        'soldagem',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
      );
      RAISE LOG '[criar_ordens_producao_automaticas] Linha de soldagem criada para item: %', v_linha.nome_produto;
    END IF;
    
    -- Linhas de perfiladeira
    IF v_linha.tipo_ordem = 'perfiladeira' AND v_ordem_perfil_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        tipo_ordem,
        item,
        quantidade,
        tamanho
      ) VALUES (
        p_pedido_id,
        v_ordem_perfil_id,
        'perfiladeira',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
      );
      RAISE LOG '[criar_ordens_producao_automaticas] Linha de perfiladeira criada para item: %', v_linha.nome_produto;
    END IF;
    
    -- Linhas de separação
    IF v_linha.tipo_ordem = 'separacao' AND v_ordem_sep_id IS NOT NULL THEN
      INSERT INTO linhas_ordens (
        pedido_id,
        ordem_id,
        tipo_ordem,
        item,
        quantidade,
        tamanho
      ) VALUES (
        p_pedido_id,
        v_ordem_sep_id,
        'separacao',
        COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
        COALESCE(v_linha.quantidade, 1),
        COALESCE(v_linha.tamanho, v_linha.largura::text || ' x ' || v_linha.altura::text)
      );
      RAISE LOG '[criar_ordens_producao_automaticas] Linha de separacao criada para item: %', v_linha.nome_produto;
    END IF;
  END LOOP;
  
  RAISE LOG '[criar_ordens_producao_automaticas] Finalizado para pedido: %', p_pedido_id;
END;
$function$;