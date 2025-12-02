-- 1. Adicionar tipo_ranking à tabela pontuacao_colaboradores
ALTER TABLE public.pontuacao_colaboradores 
ADD COLUMN IF NOT EXISTS tipo_ranking text CHECK (tipo_ranking IN ('pintura', 'perfiladeira', 'solda'));

-- 2. Remover coluna pontuacao_por_metro do estoque
ALTER TABLE public.estoque DROP COLUMN IF EXISTS pontuacao_por_metro;

-- 3. Remover colunas obsoletas de pontuacao_colaboradores
ALTER TABLE public.pontuacao_colaboradores DROP COLUMN IF EXISTS pontos_metro;
ALTER TABLE public.pontuacao_colaboradores DROP COLUMN IF EXISTS pontos_unidade;
ALTER TABLE public.pontuacao_colaboradores DROP COLUMN IF EXISTS metragem;

-- 4. Criar função para ranking de Pintura (por m² de porta)
CREATE OR REPLACE FUNCTION public.get_ranking_pintura_mes()
RETURNS TABLE(user_id uuid, nome text, foto_perfil_url text, total_pontos numeric, total_ordens bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    au.nome,
    au.foto_perfil_url,
    SUM(p.pontos_total) as total_pontos,
    COUNT(*) as total_ordens
  FROM pontuacao_colaboradores p
  JOIN admin_users au ON au.user_id = p.user_id
  WHERE p.created_at >= date_trunc('month', CURRENT_DATE)
    AND p.tipo_ranking = 'pintura'
  GROUP BY p.user_id, au.nome, au.foto_perfil_url
  ORDER BY total_pontos DESC
  LIMIT 10;
END;
$$;

-- 5. Criar função para ranking de Perfiladeira (por metro)
CREATE OR REPLACE FUNCTION public.get_ranking_perfiladeira_mes()
RETURNS TABLE(user_id uuid, nome text, foto_perfil_url text, total_pontos numeric, total_ordens bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    au.nome,
    au.foto_perfil_url,
    SUM(p.pontos_total) as total_pontos,
    COUNT(*) as total_ordens
  FROM pontuacao_colaboradores p
  JOIN admin_users au ON au.user_id = p.user_id
  WHERE p.created_at >= date_trunc('month', CURRENT_DATE)
    AND p.tipo_ranking = 'perfiladeira'
  GROUP BY p.user_id, au.nome, au.foto_perfil_url
  ORDER BY total_pontos DESC
  LIMIT 10;
END;
$$;

-- 6. Criar função para ranking de Solda (pontuação do estoque)
CREATE OR REPLACE FUNCTION public.get_ranking_solda_mes()
RETURNS TABLE(user_id uuid, nome text, foto_perfil_url text, total_pontos numeric, total_ordens bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    au.nome,
    au.foto_perfil_url,
    SUM(p.pontos_total) as total_pontos,
    COUNT(*) as total_ordens
  FROM pontuacao_colaboradores p
  JOIN admin_users au ON au.user_id = p.user_id
  WHERE p.created_at >= date_trunc('month', CURRENT_DATE)
    AND p.tipo_ranking = 'solda'
  GROUP BY p.user_id, au.nome, au.foto_perfil_url
  ORDER BY total_pontos DESC
  LIMIT 10;
END;
$$;

-- 7. Atualizar trigger para novo sistema de pontuação
CREATE OR REPLACE FUNCTION public.registrar_pontuacao_linha()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_estoque_id UUID;
  v_pontuacao_producao NUMERIC;
  v_pontos_total NUMERIC := 0;
  v_tipo_ranking TEXT;
  v_metragem_m2 NUMERIC;
  v_metragem_metros NUMERIC;
BEGIN
  -- Só processar se está marcando como concluída E tem um usuário responsável
  IF NEW.concluida = true AND NEW.concluida_por IS NOT NULL AND OLD.concluida = false THEN
    
    -- Determinar tipo de ranking baseado no tipo_ordem
    CASE NEW.tipo_ordem
      WHEN 'pintura' THEN v_tipo_ranking := 'pintura';
      WHEN 'perfiladeira' THEN v_tipo_ranking := 'perfiladeira';
      WHEN 'soldagem' THEN v_tipo_ranking := 'solda';
      ELSE v_tipo_ranking := NULL; -- Qualidade e Separação não pontuam
    END CASE;
    
    -- Só continuar se o tipo pontua
    IF v_tipo_ranking IS NOT NULL THEN
      
      -- Calcular pontuação baseada no tipo
      CASE v_tipo_ranking
        WHEN 'pintura' THEN
          -- Pintura: +1 ponto por m² (largura * altura / 1000000)
          IF NEW.largura IS NOT NULL AND NEW.altura IS NOT NULL THEN
            v_metragem_m2 := (NEW.largura / 1000.0) * (NEW.altura / 1000.0) * COALESCE(NEW.quantidade, 1);
            v_pontos_total := v_metragem_m2;
          END IF;
          
        WHEN 'perfiladeira' THEN
          -- Perfiladeira: +1 ponto por metro (tamanho)
          -- Tentar extrair metros do campo tamanho ou usar altura como fallback
          IF NEW.altura IS NOT NULL THEN
            v_metragem_metros := (NEW.altura / 1000.0) * COALESCE(NEW.quantidade, 1);
            v_pontos_total := v_metragem_metros;
          END IF;
          
        WHEN 'solda' THEN
          -- Solda: usar pontuacao_producao do estoque
          v_estoque_id := NEW.estoque_id;
          
          -- Se não tem estoque_id, tentar encontrar pelo nome do item
          IF v_estoque_id IS NULL THEN
            SELECT id INTO v_estoque_id
            FROM estoque
            WHERE LOWER(TRIM(nome_produto)) = LOWER(TRIM(NEW.item))
              AND ativo = true
            LIMIT 1;
          END IF;
          
          -- Buscar pontuação do estoque
          IF v_estoque_id IS NOT NULL THEN
            SELECT COALESCE(pontuacao_producao, 0)
            INTO v_pontuacao_producao
            FROM estoque
            WHERE id = v_estoque_id;
            
            v_pontos_total := COALESCE(NEW.quantidade, 1) * COALESCE(v_pontuacao_producao, 0);
          END IF;
      END CASE;
      
      -- Só inserir se houver pontos
      IF v_pontos_total > 0 THEN
        INSERT INTO pontuacao_colaboradores (
          user_id,
          linha_id,
          ordem_id,
          tipo_ordem,
          tipo_ranking,
          estoque_id,
          item_nome,
          quantidade,
          pontos_total
        ) VALUES (
          NEW.concluida_por,
          NEW.id,
          NEW.ordem_id,
          NEW.tipo_ordem,
          v_tipo_ranking,
          v_estoque_id,
          NEW.item,
          NEW.quantidade,
          v_pontos_total
        )
        ON CONFLICT (linha_id) DO NOTHING;
        
        RAISE LOG '[pontuacao] Registrada para linha % - User: % - Tipo: % - Pontos: %', 
          NEW.id, NEW.concluida_por, v_tipo_ranking, v_pontos_total;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;