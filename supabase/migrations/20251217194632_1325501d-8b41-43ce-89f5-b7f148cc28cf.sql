-- Atualizar registros existentes para definir tipo_ranking baseado em tipo_ordem
UPDATE pontuacao_colaboradores 
SET tipo_ranking = CASE 
  WHEN tipo_ordem = 'soldagem' THEN 'solda'
  WHEN tipo_ordem = 'perfiladeira' THEN 'perfiladeira'
  WHEN tipo_ordem = 'pintura' THEN 'pintura'
  WHEN tipo_ordem = 'separacao' THEN 'separacao'
  WHEN tipo_ordem = 'qualidade' THEN 'qualidade'
  ELSE tipo_ordem
END
WHERE tipo_ranking IS NULL;

-- Corrigir função de recálculo para definir tipo_ranking
CREATE OR REPLACE FUNCTION public.recalcular_pontuacao_linhas_concluidas()
 RETURNS TABLE(linhas_processadas integer, pontuacoes_inseridas integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_linha RECORD;
  v_estoque_id UUID;
  v_pontuacao_producao NUMERIC;
  v_pontos_total NUMERIC;
  v_tipo_ranking TEXT;
  v_linhas_processadas INTEGER := 0;
  v_pontuacoes_inseridas INTEGER := 0;
BEGIN
  FOR v_linha IN
    SELECT lo.*
    FROM linhas_ordens lo
    LEFT JOIN pontuacao_colaboradores pc ON pc.linha_id = lo.id
    WHERE lo.concluida = true
      AND lo.concluida_por IS NOT NULL
      AND pc.id IS NULL
  LOOP
    v_linhas_processadas := v_linhas_processadas + 1;
    v_estoque_id := v_linha.estoque_id;
    
    IF v_estoque_id IS NULL THEN
      SELECT id INTO v_estoque_id
      FROM estoque
      WHERE LOWER(TRIM(nome_produto)) = LOWER(TRIM(v_linha.item))
        AND ativo = true
      LIMIT 1;
    END IF;
    
    IF v_estoque_id IS NOT NULL THEN
      SELECT COALESCE(pontuacao_producao, 0)
      INTO v_pontuacao_producao
      FROM estoque
      WHERE id = v_estoque_id;
      
      IF v_pontuacao_producao > 0 THEN
        v_pontos_total := v_linha.quantidade * v_pontuacao_producao;
        
        -- Definir tipo_ranking baseado em tipo_ordem
        v_tipo_ranking := CASE 
          WHEN v_linha.tipo_ordem = 'soldagem' THEN 'solda'
          WHEN v_linha.tipo_ordem = 'perfiladeira' THEN 'perfiladeira'
          WHEN v_linha.tipo_ordem = 'pintura' THEN 'pintura'
          WHEN v_linha.tipo_ordem = 'separacao' THEN 'separacao'
          WHEN v_linha.tipo_ordem = 'qualidade' THEN 'qualidade'
          ELSE v_linha.tipo_ordem
        END;
        
        INSERT INTO pontuacao_colaboradores (
          user_id,
          linha_id,
          ordem_id,
          tipo_ordem,
          tipo_ranking,
          estoque_id,
          item_nome,
          quantidade,
          pontos_total,
          created_at
        ) VALUES (
          v_linha.concluida_por,
          v_linha.id,
          v_linha.ordem_id,
          v_linha.tipo_ordem,
          v_tipo_ranking,
          v_estoque_id,
          v_linha.item,
          v_linha.quantidade,
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
$function$;