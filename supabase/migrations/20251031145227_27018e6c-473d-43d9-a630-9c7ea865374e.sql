-- Adicionar coluna ordem_id para referenciar a ordem específica
ALTER TABLE linhas_ordens 
ADD COLUMN ordem_id uuid;

-- Criar índice para melhor performance
CREATE INDEX idx_linhas_ordens_ordem_id ON linhas_ordens(ordem_id);

-- Atualizar linhas existentes para associar à ordem correta
-- Soldagem
UPDATE linhas_ordens lo
SET ordem_id = os.id
FROM ordens_soldagem os
WHERE lo.pedido_id = os.pedido_id 
AND lo.tipo_ordem = 'soldagem'
AND lo.ordem_id IS NULL;

-- Perfiladeira
UPDATE linhas_ordens lo
SET ordem_id = op.id
FROM ordens_perfiladeira op
WHERE lo.pedido_id = op.pedido_id 
AND lo.tipo_ordem = 'perfiladeira'
AND lo.ordem_id IS NULL;

-- Separação
UPDATE linhas_ordens lo
SET ordem_id = ose.id
FROM ordens_separacao ose
WHERE lo.pedido_id = ose.pedido_id 
AND lo.tipo_ordem = 'separacao'
AND lo.ordem_id IS NULL;

-- Atualizar função de criação de ordens para incluir ordem_id
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
  
  -- Criar linhas de cada ordem baseado nas linhas do pedido
  FOR v_linha IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id
  LOOP
    -- Linha de soldagem
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
    
    -- Linha de perfiladeira
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
    
    -- Linha de separação
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
  END LOOP;
END;
$function$;