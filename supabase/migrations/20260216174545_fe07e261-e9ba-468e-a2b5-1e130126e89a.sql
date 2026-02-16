
-- 1. Adicionar novas colunas de métricas à pontuacao_colaboradores
ALTER TABLE public.pontuacao_colaboradores
  ADD COLUMN IF NOT EXISTS metragem_linear NUMERIC,
  ADD COLUMN IF NOT EXISTS porta_soldada TEXT,
  ADD COLUMN IF NOT EXISTS pedido_separado INTEGER,
  ADD COLUMN IF NOT EXISTS metragem_quadrada_pintada NUMERIC;

-- 2. Reescrever a função registrar_pontuacao_linha() - agora só atua para perfiladeira
CREATE OR REPLACE FUNCTION public.registrar_pontuacao_linha()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tamanho_num NUMERIC;
  v_metragem NUMERIC;
BEGIN
  -- Só processar se está marcando como concluída E tem um usuário responsável
  IF NEW.concluida = true AND OLD.concluida = false AND NEW.concluida_por IS NOT NULL THEN
    
    -- Apenas perfiladeira pontua no trigger de linha
    IF NEW.tipo_ordem = 'perfiladeira' THEN
      -- Calcular metragem linear: tamanho (em mm, converter para metros) * quantidade
      v_tamanho_num := NULL;
      
      -- Tentar extrair número do campo tamanho
      IF NEW.tamanho IS NOT NULL AND NEW.tamanho != '' THEN
        v_tamanho_num := NULLIF(regexp_replace(NEW.tamanho, '[^0-9.]', '', 'g'), '')::NUMERIC;
      END IF;
      
      -- Fallback para altura se tamanho não disponível
      IF v_tamanho_num IS NULL AND NEW.altura IS NOT NULL THEN
        v_tamanho_num := NEW.altura;
      END IF;
      
      IF v_tamanho_num IS NOT NULL AND v_tamanho_num > 0 THEN
        -- Se valor > 100, provavelmente está em mm, converter para metros
        IF v_tamanho_num > 100 THEN
          v_metragem := (v_tamanho_num / 1000.0) * COALESCE(NEW.quantidade, 1);
        ELSE
          v_metragem := v_tamanho_num * COALESCE(NEW.quantidade, 1);
        END IF;
        
        INSERT INTO pontuacao_colaboradores (
          user_id, linha_id, ordem_id, tipo_ordem, tipo_ranking,
          item_nome, quantidade, pontos_total, metragem_linear
        ) VALUES (
          NEW.concluida_por, NEW.id, NEW.ordem_id, NEW.tipo_ordem, 'perfiladeira',
          NEW.item, NEW.quantidade, v_metragem, v_metragem
        )
        ON CONFLICT (linha_id) DO NOTHING;
      END IF;
    END IF;
    -- Solda, separação e pintura são tratados pelo trigger de ordem
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Criar função registrar_pontuacao_ordem() para solda, separação e pintura
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
  -- Determinar tipo de ordem pela tabela que disparou o trigger
  v_tipo_ordem := TG_ARGV[0]; -- passado como argumento do trigger
  
  -- Só processar quando status muda para concluido/pronta
  IF NEW.status IN ('concluido', 'pronta') AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    v_pedido_id := NEW.pedido_id;
    v_responsavel_id := NEW.responsavel_id;
    
    -- Buscar venda_id via pedidos_producao
    SELECT venda_id INTO v_venda_id
    FROM pedidos_producao
    WHERE id = v_pedido_id;
    
    IF v_venda_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- ========== SOLDAGEM ==========
    IF v_tipo_ordem = 'soldagem' THEN
      -- Para cada linha da ordem, buscar portas do pedido e classificar
      FOR v_linha IN 
        SELECT lo.id as linha_id, lo.item, lo.quantidade
        FROM linhas_ordens lo
        WHERE lo.ordem_id = NEW.id AND lo.tipo_ordem = 'soldagem'
      LOOP
        -- Buscar as portas_enrolar do pedido para classificar
        -- Usa a primeira porta encontrada para a classificação
        SELECT 
          CASE 
            WHEN (pv.largura / 1000.0) * (pv.altura / 1000.0) > 50 THEN 'GG'
            WHEN (pv.largura / 1000.0) * (pv.altura / 1000.0) >= 25 THEN 'G'
            ELSE 'P'
          END INTO v_categoria
        FROM produtos_vendas pv
        WHERE pv.venda_id = v_venda_id
          AND pv.tipo_produto = 'porta_enrolar'
          AND pv.largura IS NOT NULL 
          AND pv.altura IS NOT NULL
        LIMIT 1;
        
        -- Se não encontrou porta, classificar como P por padrão
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
      -- Buscar primeira linha da ordem
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
      -- Calcular m² total das portas_enrolar do pedido
      SELECT COALESCE(SUM((pv.largura / 1000.0) * (pv.altura / 1000.0) * COALESCE(pv.quantidade, 1)), 0)
      INTO v_m2_total
      FROM produtos_vendas pv
      WHERE pv.venda_id = v_venda_id
        AND pv.tipo_produto = 'porta_enrolar'
        AND pv.largura IS NOT NULL
        AND pv.altura IS NOT NULL;
      
      -- Contar linhas da ordem
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

-- 4. Criar triggers nas tabelas de ordens
-- Soldagem
DROP TRIGGER IF EXISTS trigger_pontuacao_ordem_soldagem ON public.ordens_soldagem;
CREATE TRIGGER trigger_pontuacao_ordem_soldagem
  AFTER UPDATE OF status ON public.ordens_soldagem
  FOR EACH ROW
  EXECUTE FUNCTION registrar_pontuacao_ordem('soldagem');

-- Separação
DROP TRIGGER IF EXISTS trigger_pontuacao_ordem_separacao ON public.ordens_separacao;
CREATE TRIGGER trigger_pontuacao_ordem_separacao
  AFTER UPDATE OF status ON public.ordens_separacao
  FOR EACH ROW
  EXECUTE FUNCTION registrar_pontuacao_ordem('separacao');

-- Pintura
DROP TRIGGER IF EXISTS trigger_pontuacao_ordem_pintura ON public.ordens_pintura;
CREATE TRIGGER trigger_pontuacao_ordem_pintura
  AFTER UPDATE OF status ON public.ordens_pintura
  FOR EACH ROW
  EXECUTE FUNCTION registrar_pontuacao_ordem('pintura');
