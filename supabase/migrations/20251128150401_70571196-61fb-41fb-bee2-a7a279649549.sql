-- Função para recalcular pontuação de linhas já concluídas
CREATE OR REPLACE FUNCTION recalcular_pontuacao_linhas_concluidas()
RETURNS TABLE (
  linhas_processadas INTEGER,
  pontuacoes_inseridas INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_linha RECORD;
  v_estoque_id UUID;
  v_pontuacao_producao NUMERIC;
  v_pontuacao_por_metro NUMERIC;
  v_metragem NUMERIC;
  v_pontos_unidade NUMERIC;
  v_pontos_metro NUMERIC;
  v_pontos_total NUMERIC;
  v_linhas_processadas INTEGER := 0;
  v_pontuacoes_inseridas INTEGER := 0;
BEGIN
  -- Percorrer todas as linhas concluídas que não têm pontuação
  FOR v_linha IN
    SELECT lo.*
    FROM linhas_ordens lo
    LEFT JOIN pontuacao_colaboradores pc ON pc.linha_id = lo.id
    WHERE lo.concluida = true
      AND lo.concluida_por IS NOT NULL
      AND pc.id IS NULL
  LOOP
    v_linhas_processadas := v_linhas_processadas + 1;
    
    -- Tentar usar o estoque_id da linha
    v_estoque_id := v_linha.estoque_id;
    
    -- Se não tem estoque_id, tentar encontrar pelo nome
    IF v_estoque_id IS NULL THEN
      SELECT id INTO v_estoque_id
      FROM estoque
      WHERE LOWER(TRIM(nome_produto)) = LOWER(TRIM(v_linha.item))
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
      
      -- Só processar se houver alguma pontuação configurada
      IF v_pontuacao_producao > 0 OR v_pontuacao_por_metro > 0 THEN
        
        -- Calcular metragem
        IF v_linha.largura IS NOT NULL AND v_linha.altura IS NOT NULL THEN
          v_metragem := (v_linha.largura / 1000.0) * (v_linha.altura / 1000.0) * v_linha.quantidade;
        ELSE
          v_metragem := 0;
        END IF;
        
        -- Calcular pontos
        v_pontos_unidade := v_linha.quantidade * v_pontuacao_producao;
        v_pontos_metro := v_metragem * v_pontuacao_por_metro;
        v_pontos_total := v_pontos_unidade + v_pontos_metro;
        
        -- Inserir pontuação
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
          pontos_total,
          created_at
        ) VALUES (
          v_linha.concluida_por,
          v_linha.id,
          v_linha.ordem_id,
          v_linha.tipo_ordem,
          v_estoque_id,
          v_linha.item,
          v_linha.quantidade,
          v_metragem,
          v_pontos_unidade,
          v_pontos_metro,
          v_pontos_total,
          COALESCE(v_linha.concluida_em, now())
        )
        ON CONFLICT (linha_id) DO NOTHING;
        
        v_pontuacoes_inseridas := v_pontuacoes_inseridas + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_linhas_processadas, v_pontuacoes_inseridas;
END;
$$;

COMMENT ON FUNCTION recalcular_pontuacao_linhas_concluidas() IS 
  'Recalcula e insere pontuações para linhas já concluídas que ainda não têm registro de pontuação';

-- Executar a função para processar linhas históricas
SELECT * FROM recalcular_pontuacao_linhas_concluidas();