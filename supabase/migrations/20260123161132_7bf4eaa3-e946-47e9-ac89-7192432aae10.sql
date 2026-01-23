-- 1. Deletar pontuações associadas a linhas órfãs de perfiladeira
DELETE FROM pontuacao_colaboradores pc
WHERE pc.linha_id IN (
  SELECT lo.id FROM linhas_ordens lo
  WHERE lo.tipo_ordem = 'perfiladeira' 
  AND NOT EXISTS (SELECT 1 FROM ordens_perfiladeira op WHERE op.id = lo.ordem_id)
);

-- 2. Deletar pontuações associadas a linhas órfãs de soldagem
DELETE FROM pontuacao_colaboradores pc
WHERE pc.linha_id IN (
  SELECT lo.id FROM linhas_ordens lo
  WHERE lo.tipo_ordem = 'soldagem' 
  AND NOT EXISTS (SELECT 1 FROM ordens_soldagem os WHERE os.id = lo.ordem_id)
);

-- 3. Deletar pontuações associadas a linhas órfãs de separacao
DELETE FROM pontuacao_colaboradores pc
WHERE pc.linha_id IN (
  SELECT lo.id FROM linhas_ordens lo
  WHERE lo.tipo_ordem = 'separacao' 
  AND NOT EXISTS (SELECT 1 FROM ordens_separacao os WHERE os.id = lo.ordem_id)
);

-- 4. Limpar linhas órfãs existentes para perfiladeira
DELETE FROM linhas_ordens lo
WHERE tipo_ordem = 'perfiladeira' 
AND NOT EXISTS (SELECT 1 FROM ordens_perfiladeira op WHERE op.id = lo.ordem_id);

-- 5. Limpar linhas órfãs existentes para soldagem
DELETE FROM linhas_ordens lo
WHERE tipo_ordem = 'soldagem' 
AND NOT EXISTS (SELECT 1 FROM ordens_soldagem os WHERE os.id = lo.ordem_id);

-- 6. Limpar linhas órfãs existentes para separacao
DELETE FROM linhas_ordens lo
WHERE tipo_ordem = 'separacao' 
AND NOT EXISTS (SELECT 1 FROM ordens_separacao os WHERE os.id = lo.ordem_id);

-- 7. Atualizar a função criar_ordens_producao_automaticas para verificar se a ordem ainda existe
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_numero_ordem TEXT;
  v_contador INTEGER;
  v_ano TEXT;
  v_ordem_soldagem_id UUID;
  v_ordem_perfiladeira_id UUID;
  v_ordem_separacao_id UUID;
  v_linha RECORD;
  v_setor_producao TEXT;
BEGIN
  -- Só executa se o pedido estiver sendo liberado para produção
  IF NEW.status = 'em_producao' AND (OLD.status IS NULL OR OLD.status != 'em_producao') THEN
    
    v_ano := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Verificar se já existem ordens ativas (não históricas) para este pedido
    -- Criar ordem de SOLDAGEM se não existir ordem ativa
    IF NOT EXISTS (
      SELECT 1 FROM ordens_soldagem 
      WHERE pedido_id = NEW.id AND (historico IS NULL OR historico = false)
    ) THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 'OSO-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
      INTO v_contador
      FROM ordens_soldagem
      WHERE numero_ordem LIKE 'OSO-' || v_ano || '-%';
      
      v_numero_ordem := 'OSO-' || v_ano || '-' || LPAD(v_contador::TEXT, 4, '0');
      
      INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status)
      VALUES (NEW.id, v_numero_ordem, 'pendente')
      RETURNING id INTO v_ordem_soldagem_id;
      
      -- Criar linhas para soldagem - apenas se não existir linha com ordem válida
      FOR v_linha IN 
        SELECT pl.id, pl.setor_responsavel_producao
        FROM pedidos_linhas pl
        WHERE pl.pedido_id = NEW.id
        AND pl.setor_responsavel_producao = 'soldagem'
        AND NOT EXISTS (
          SELECT 1 FROM linhas_ordens lo 
          WHERE lo.pedido_linha_id = pl.id 
          AND lo.tipo_ordem = 'soldagem'
          AND EXISTS (SELECT 1 FROM ordens_soldagem os WHERE os.id = lo.ordem_id)
        )
      LOOP
        INSERT INTO linhas_ordens (ordem_id, pedido_linha_id, tipo_ordem, concluida)
        VALUES (v_ordem_soldagem_id, v_linha.id, 'soldagem', false);
      END LOOP;
    END IF;
    
    -- Criar ordem de PERFILADEIRA se não existir ordem ativa
    IF NOT EXISTS (
      SELECT 1 FROM ordens_perfiladeira 
      WHERE pedido_id = NEW.id AND (historico IS NULL OR historico = false)
    ) THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 'OPE-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
      INTO v_contador
      FROM ordens_perfiladeira
      WHERE numero_ordem LIKE 'OPE-' || v_ano || '-%';
      
      v_numero_ordem := 'OPE-' || v_ano || '-' || LPAD(v_contador::TEXT, 4, '0');
      
      INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status)
      VALUES (NEW.id, v_numero_ordem, 'pendente')
      RETURNING id INTO v_ordem_perfiladeira_id;
      
      -- Criar linhas para perfiladeira - apenas se não existir linha com ordem válida
      FOR v_linha IN 
        SELECT pl.id, pl.setor_responsavel_producao
        FROM pedidos_linhas pl
        WHERE pl.pedido_id = NEW.id
        AND pl.setor_responsavel_producao = 'perfiladeira'
        AND NOT EXISTS (
          SELECT 1 FROM linhas_ordens lo 
          WHERE lo.pedido_linha_id = pl.id 
          AND lo.tipo_ordem = 'perfiladeira'
          AND EXISTS (SELECT 1 FROM ordens_perfiladeira op WHERE op.id = lo.ordem_id)
        )
      LOOP
        INSERT INTO linhas_ordens (ordem_id, pedido_linha_id, tipo_ordem, concluida)
        VALUES (v_ordem_perfiladeira_id, v_linha.id, 'perfiladeira', false);
      END LOOP;
    END IF;
    
    -- Criar ordem de SEPARAÇÃO se não existir ordem ativa
    IF NOT EXISTS (
      SELECT 1 FROM ordens_separacao 
      WHERE pedido_id = NEW.id AND (historico IS NULL OR historico = false)
    ) THEN
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordem FROM 'OSE-[0-9]{4}-([0-9]+)') AS INTEGER)), 0) + 1
      INTO v_contador
      FROM ordens_separacao
      WHERE numero_ordem LIKE 'OSE-' || v_ano || '-%';
      
      v_numero_ordem := 'OSE-' || v_ano || '-' || LPAD(v_contador::TEXT, 4, '0');
      
      INSERT INTO ordens_separacao (pedido_id, numero_ordem, status)
      VALUES (NEW.id, v_numero_ordem, 'pendente')
      RETURNING id INTO v_ordem_separacao_id;
      
      -- Criar linhas para separação - apenas se não existir linha com ordem válida
      FOR v_linha IN 
        SELECT pl.id, pl.setor_responsavel_producao
        FROM pedidos_linhas pl
        WHERE pl.pedido_id = NEW.id
        AND pl.setor_responsavel_producao = 'separacao'
        AND NOT EXISTS (
          SELECT 1 FROM linhas_ordens lo 
          WHERE lo.pedido_linha_id = pl.id 
          AND lo.tipo_ordem = 'separacao'
          AND EXISTS (SELECT 1 FROM ordens_separacao os WHERE os.id = lo.ordem_id)
        )
      LOOP
        INSERT INTO linhas_ordens (ordem_id, pedido_linha_id, tipo_ordem, concluida)
        VALUES (v_ordem_separacao_id, v_linha.id, 'separacao', false);
      END LOOP;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;