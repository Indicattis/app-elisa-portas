-- Fix: Remove /1000.0 divisions since largura/altura are already in meters
CREATE OR REPLACE FUNCTION public.registrar_pontuacao_ordem()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tipo_ordem TEXT;
  v_pedido_id UUID;
  v_venda_id UUID;
  v_responsavel_id UUID;
  v_linha RECORD;
  v_produto RECORD;
  v_area NUMERIC;
  v_categoria TEXT;
  v_m2_total NUMERIC := 0;
  v_m2_por_linha NUMERIC;
  v_num_linhas INTEGER;
  v_primeira_linha_id UUID;
BEGIN
  v_tipo_ordem := TG_ARGV[0];
  
  IF NEW.status IN ('concluido', 'pronta') AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    v_pedido_id := NEW.pedido_id;
    v_responsavel_id := NEW.responsavel_id;
    
    SELECT venda_id INTO v_venda_id
    FROM pedidos_producao
    WHERE id = v_pedido_id;
    
    IF v_venda_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- ========== SOLDAGEM ==========
    IF v_tipo_ordem = 'soldagem' THEN
      FOR v_linha IN 
        SELECT lo.id as linha_id, lo.item, lo.quantidade
        FROM linhas_ordens lo
        WHERE lo.ordem_id = NEW.id AND lo.tipo_ordem = 'soldagem'
      LOOP
        SELECT 
          CASE 
            WHEN pv.largura * pv.altura > 50 THEN 'GG'
            WHEN pv.largura * pv.altura >= 25 THEN 'G'
            ELSE 'P'
          END INTO v_categoria
        FROM produtos_vendas pv
        WHERE pv.venda_id = v_venda_id
          AND pv.tipo_produto = 'porta_enrolar'
          AND pv.largura IS NOT NULL 
          AND pv.altura IS NOT NULL
        LIMIT 1;
        
        IF v_categoria IS NULL THEN
          v_categoria := 'P';
        END IF;
        
        INSERT INTO pontuacao_colaboradores (
          user_id, linha_id, ordem_id, tipo_ordem, tipo_ranking,
          item_nome, quantidade, pontos_total, porta_soldada
        ) VALUES (
          v_responsavel_id, v_linha.linha_id, NEW.id, 'soldagem', 'solda',
          v_linha.item, v_linha.quantidade, 1, v_categoria
        )
        ON CONFLICT (linha_id) DO NOTHING;
      END LOOP;
    
    -- ========== SEPARAÇÃO ==========
    ELSIF v_tipo_ordem = 'separacao' THEN
      SELECT lo.id INTO v_primeira_linha_id
      FROM linhas_ordens lo
      WHERE lo.ordem_id = NEW.id AND lo.tipo_ordem = 'separacao'
      ORDER BY lo.created_at ASC
      LIMIT 1;
      
      IF v_primeira_linha_id IS NOT NULL THEN
        INSERT INTO pontuacao_colaboradores (
          user_id, linha_id, ordem_id, tipo_ordem, tipo_ranking,
          item_nome, quantidade, pontos_total, pedido_separado
        ) VALUES (
          v_responsavel_id, v_primeira_linha_id, NEW.id, 'separacao', 'separacao',
          'Pedido separado', 1, 1, 1
        )
        ON CONFLICT (linha_id) DO NOTHING;
      END IF;
    
    -- ========== PINTURA ==========
    ELSIF v_tipo_ordem = 'pintura' THEN
      SELECT COALESCE(SUM(pv.largura * pv.altura * COALESCE(pv.quantidade, 1)), 0)
      INTO v_m2_total
      FROM produtos_vendas pv
      WHERE pv.venda_id = v_venda_id
        AND pv.tipo_produto = 'porta_enrolar'
        AND pv.largura IS NOT NULL
        AND pv.altura IS NOT NULL;
      
      SELECT COUNT(*) INTO v_num_linhas
      FROM linhas_ordens lo
      WHERE lo.ordem_id = NEW.id AND lo.tipo_ordem = 'pintura';
      
      IF v_num_linhas > 0 AND v_m2_total > 0 THEN
        v_m2_por_linha := v_m2_total / v_num_linhas;
        
        FOR v_linha IN
          SELECT lo.id as linha_id, lo.item, lo.quantidade
          FROM linhas_ordens lo
          WHERE lo.ordem_id = NEW.id AND lo.tipo_ordem = 'pintura'
        LOOP
          INSERT INTO pontuacao_colaboradores (
            user_id, linha_id, ordem_id, tipo_ordem, tipo_ranking,
            item_nome, quantidade, pontos_total, metragem_quadrada_pintada
          ) VALUES (
            v_responsavel_id, v_linha.linha_id, NEW.id, 'pintura', 'pintura',
            v_linha.item, v_linha.quantidade, v_m2_por_linha, v_m2_por_linha
          )
          ON CONFLICT (linha_id) DO NOTHING;
        END LOOP;
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;