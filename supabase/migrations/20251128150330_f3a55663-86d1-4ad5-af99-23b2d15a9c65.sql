-- Função para registrar pontuação ao concluir linha
CREATE OR REPLACE FUNCTION registrar_pontuacao_linha()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estoque_id UUID;
  v_pontuacao_producao NUMERIC;
  v_pontuacao_por_metro NUMERIC;
  v_metragem NUMERIC;
  v_pontos_unidade NUMERIC;
  v_pontos_metro NUMERIC;
  v_pontos_total NUMERIC;
BEGIN
  -- Só processar se está marcando como concluída E tem um usuário responsável
  IF NEW.concluida = true AND NEW.concluida_por IS NOT NULL AND OLD.concluida = false THEN
    
    -- Primeiro tentar usar o estoque_id da linha
    v_estoque_id := NEW.estoque_id;
    
    -- Se não tem estoque_id, tentar encontrar pelo nome do item
    IF v_estoque_id IS NULL THEN
      SELECT id INTO v_estoque_id
      FROM estoque
      WHERE LOWER(TRIM(nome_produto)) = LOWER(TRIM(NEW.item))
        AND ativo = true
      LIMIT 1;
    END IF;
    
    -- Se encontrou o item no estoque, buscar pontuação
    IF v_estoque_id IS NOT NULL THEN
      SELECT 
        COALESCE(pontuacao_producao, 0),
        COALESCE(pontuacao_por_metro, 0)
      INTO 
        v_pontuacao_producao,
        v_pontuacao_por_metro
      FROM estoque
      WHERE id = v_estoque_id;
      
      -- Só calcular se houver alguma pontuação configurada
      IF v_pontuacao_producao > 0 OR v_pontuacao_por_metro > 0 THEN
        
        -- Calcular metragem (largura * altura em metros)
        IF NEW.largura IS NOT NULL AND NEW.altura IS NOT NULL THEN
          v_metragem := (NEW.largura / 1000.0) * (NEW.altura / 1000.0) * NEW.quantidade;
        ELSE
          v_metragem := 0;
        END IF;
        
        -- Calcular pontos
        v_pontos_unidade := NEW.quantidade * v_pontuacao_producao;
        v_pontos_metro := v_metragem * v_pontuacao_por_metro;
        v_pontos_total := v_pontos_unidade + v_pontos_metro;
        
        -- Inserir pontuação (evitar duplicatas)
        INSERT INTO pontuacao_colaboradores (
          user_id,
          linha_id,
          ordem_id,
          tipo_ordem,
          estoque_id,
          item_nome,
          quantidade,
          metragem,
          pontos_unidade,
          pontos_metro,
          pontos_total
        ) VALUES (
          NEW.concluida_por,
          NEW.id,
          NEW.ordem_id,
          NEW.tipo_ordem,
          v_estoque_id,
          NEW.item,
          NEW.quantidade,
          v_metragem,
          v_pontos_unidade,
          v_pontos_metro,
          v_pontos_total
        )
        ON CONFLICT (linha_id) DO NOTHING;
        
        RAISE LOG '[pontuacao] Registrada para linha % - User: % - Pontos: %', 
          NEW.id, NEW.concluida_por, v_pontos_total;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para registrar pontuação automaticamente
DROP TRIGGER IF EXISTS trigger_registrar_pontuacao_linha ON linhas_ordens;

CREATE TRIGGER trigger_registrar_pontuacao_linha
  AFTER UPDATE OF concluida ON linhas_ordens
  FOR EACH ROW
  EXECUTE FUNCTION registrar_pontuacao_linha();

-- Adicionar constraint unique para evitar duplicatas na pontuação
ALTER TABLE pontuacao_colaboradores 
  DROP CONSTRAINT IF EXISTS pontuacao_colaboradores_linha_id_key;

ALTER TABLE pontuacao_colaboradores 
  ADD CONSTRAINT pontuacao_colaboradores_linha_id_key UNIQUE (linha_id);

COMMENT ON TRIGGER trigger_registrar_pontuacao_linha ON linhas_ordens IS 
  'Registra automaticamente a pontuação do colaborador quando uma linha é concluída';