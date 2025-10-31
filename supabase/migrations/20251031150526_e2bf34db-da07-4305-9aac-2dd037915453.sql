-- Adicionar coluna tipo_ordem na tabela pedido_linhas
ALTER TABLE pedido_linhas
ADD COLUMN tipo_ordem text CHECK (tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao'));

-- Por padrão, atribuir 'soldagem' às linhas existentes
UPDATE pedido_linhas
SET tipo_ordem = 'soldagem'
WHERE tipo_ordem IS NULL;

-- Limpar linhas duplicadas em linhas_ordens (manter apenas uma por pedido_linha)
-- Primeiro, identificar e manter apenas a primeira linha de cada grupo
WITH linhas_para_manter AS (
  SELECT DISTINCT ON (pedido_id, item, quantidade, tamanho, tipo_ordem) id
  FROM linhas_ordens
  ORDER BY pedido_id, item, quantidade, tamanho, tipo_ordem, created_at ASC
)
DELETE FROM linhas_ordens
WHERE id NOT IN (SELECT id FROM linhas_para_manter);

-- Atualizar função criar_ordens_producao_automaticas para respeitar tipo_ordem
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
BEGIN
  -- Gerar números de ordem
  SELECT gerar_numero_ordem('soldagem') INTO v_numero_solda;
  SELECT gerar_numero_ordem('perfiladeira') INTO v_numero_perfil;
  SELECT gerar_numero_ordem('separacao') INTO v_numero_sep;
  
  -- Criar ordem de soldagem
  INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_solda, 'pendente')
  RETURNING id INTO v_ordem_solda_id;
  
  -- Criar ordem de perfiladeira
  INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_perfil, 'pendente')
  RETURNING id INTO v_ordem_perfil_id;
  
  -- Criar ordem de separação
  INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_sep, 'pendente')
  RETURNING id INTO v_ordem_sep_id;
  
  -- Criar linhas de cada ordem baseado nas linhas do pedido E seu tipo_ordem
  FOR v_linha IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id
  LOOP
    -- Inserir linha apenas na ordem correspondente ao tipo_ordem
    IF v_linha.tipo_ordem = 'soldagem' OR v_linha.tipo_ordem IS NULL THEN
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
    END IF;
    
    IF v_linha.tipo_ordem = 'perfiladeira' THEN
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
    END IF;
    
    IF v_linha.tipo_ordem = 'separacao' THEN
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
    END IF;
  END LOOP;
END;
$function$;