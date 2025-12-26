-- ============================================
-- Tabela para ordens de porta social (terceirização)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ordens_porta_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_producao(id) ON DELETE CASCADE,
  numero_ordem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  
  -- Delegação (diferente de captura)
  delegado_para_id UUID,
  delegado_por_id UUID,
  delegado_em TIMESTAMP WITH TIME ZONE,
  
  -- Controle de tempo
  capturada_em TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  tempo_conclusao_segundos INTEGER,
  
  -- Backlog e prioridade (herança do pedido)
  em_backlog BOOLEAN DEFAULT false,
  prioridade INTEGER DEFAULT 0,
  historico BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadados
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(pedido_id)
);

-- RLS
ALTER TABLE public.ordens_porta_social ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage ordens_porta_social" ON public.ordens_porta_social;
CREATE POLICY "Authenticated users can manage ordens_porta_social" 
ON public.ordens_porta_social 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_ordens_porta_social_updated_at ON public.ordens_porta_social;
CREATE TRIGGER update_ordens_porta_social_updated_at
  BEFORE UPDATE ON public.ordens_porta_social
  FOR EACH ROW EXECUTE FUNCTION update_pedido_linhas_updated_at();

-- ============================================
-- Atualizar função gerar_numero_ordem para suportar porta_social
-- ============================================
DROP FUNCTION IF EXISTS gerar_numero_ordem(text);

CREATE FUNCTION gerar_numero_ordem(tipo_ordem text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  prefixo text;
  tabela_nome text;
  ano text;
  proximo_numero integer;
  numero_formatado text;
BEGIN
  ano := to_char(now(), 'YYYY');
  
  -- Mapear tipo para prefixo e tabela
  CASE tipo_ordem
    WHEN 'soldagem' THEN 
      prefixo := 'OSL';
      tabela_nome := 'ordens_soldagem';
    WHEN 'perfiladeira' THEN 
      prefixo := 'OPE';
      tabela_nome := 'ordens_perfiladeira';
    WHEN 'separacao' THEN 
      prefixo := 'OSE';
      tabela_nome := 'ordens_separacao';
    WHEN 'qualidade' THEN 
      prefixo := 'OQU';
      tabela_nome := 'ordens_qualidade';
    WHEN 'pintura' THEN 
      prefixo := 'OPI';
      tabela_nome := 'ordens_pintura';
    WHEN 'carregamento' THEN 
      prefixo := 'OCA';
      tabela_nome := 'ordens_carregamento';
    WHEN 'porta_social' THEN 
      prefixo := 'OPS';
      tabela_nome := 'ordens_porta_social';
    ELSE
      RAISE EXCEPTION 'Tipo de ordem desconhecido: %', tipo_ordem;
  END CASE;
  
  -- Buscar próximo número para o ano atual
  EXECUTE format(
    'SELECT COALESCE(MAX(
      CASE 
        WHEN numero_ordem ~ ''^%s-%s-[0-9]+$'' 
        THEN CAST(split_part(numero_ordem, ''-'', 3) AS integer)
        ELSE 0 
      END
    ), 0) + 1 FROM %I',
    prefixo, ano, tabela_nome
  ) INTO proximo_numero;
  
  -- Formatar número com zeros à esquerda
  numero_formatado := lpad(proximo_numero::text, 4, '0');
  
  RETURN prefixo || '-' || ano || '-' || numero_formatado;
END;
$$;

-- ============================================
-- Atualizar função criar_ordens_producao_automaticas para criar ordem de porta_social
-- ============================================
CREATE OR REPLACE FUNCTION criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_linha RECORD;
  v_tem_soldagem BOOLEAN := false;
  v_tem_perfiladeira BOOLEAN := false;
  v_tem_separacao BOOLEAN := false;
  v_tem_porta_social BOOLEAN := false;
  v_ordem_solda_id uuid;
  v_ordem_perfil_id uuid;
  v_ordem_separacao_id uuid;
  v_ordem_porta_social_id uuid;
  v_numero_ordem_solda text;
  v_numero_ordem_perfil text;
  v_numero_ordem_separacao text;
  v_numero_ordem_porta_social text;
  v_pedido_em_backlog BOOLEAN;
  v_pedido_prioridade INTEGER;
  v_setor text;
BEGIN
  RAISE LOG '[criar_ordens_producao_automaticas] Iniciando para pedido: %', p_pedido_id;

  -- Buscar status de backlog e prioridade do pedido
  SELECT em_backlog, prioridade_etapa 
  INTO v_pedido_em_backlog, v_pedido_prioridade
  FROM pedidos_producao 
  WHERE id = p_pedido_id;
  
  RAISE LOG '[criar_ordens_producao_automaticas] Pedido backlog: %, prioridade: %', 
    v_pedido_em_backlog, v_pedido_prioridade;

  -- Verificar que tipos de ordens são necessários (baseado em pedido_linhas)
  FOR v_linha IN
    SELECT DISTINCT 
      COALESCE(
        e.setor_responsavel_producao::text,
        CASE pl.categoria_linha
          WHEN 'solda' THEN 'soldagem'
          WHEN 'perfiladeira' THEN 'perfiladeira'
          WHEN 'separacao' THEN 'separacao'
          ELSE NULL
        END
      ) as setor
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
  LOOP
    IF v_linha.setor = 'soldagem' THEN
      v_tem_soldagem := true;
    ELSIF v_linha.setor = 'perfiladeira' THEN
      v_tem_perfiladeira := true;
    ELSIF v_linha.setor = 'separacao' THEN
      v_tem_separacao := true;
    END IF;
  END LOOP;

  -- Verificar se a venda do pedido contém porta_social
  SELECT EXISTS (
    SELECT 1 
    FROM produtos_vendas pv
    JOIN pedidos_producao pp ON pv.venda_id = pp.venda_id
    WHERE pp.id = p_pedido_id 
    AND pv.tipo_produto = 'porta_social'
  ) INTO v_tem_porta_social;

  -- Criar ordem de SOLDAGEM se necessário
  IF v_tem_soldagem THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_soldagem WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('soldagem') INTO v_numero_ordem_solda;
      INSERT INTO ordens_soldagem (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_solda, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_solda_id;
    ELSE
      SELECT id INTO v_ordem_solda_id FROM ordens_soldagem WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar ordem de PERFILADEIRA se necessário
  IF v_tem_perfiladeira THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('perfiladeira') INTO v_numero_ordem_perfil;
      INSERT INTO ordens_perfiladeira (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_perfil, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_perfil_id;
    ELSE
      SELECT id INTO v_ordem_perfil_id FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar ordem de SEPARAÇÃO se necessário
  IF v_tem_separacao THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_separacao WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('separacao') INTO v_numero_ordem_separacao;
      INSERT INTO ordens_separacao (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_separacao, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_separacao_id;
    ELSE
      SELECT id INTO v_ordem_separacao_id FROM ordens_separacao WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar ordem de PORTA SOCIAL se necessário
  IF v_tem_porta_social THEN
    IF NOT EXISTS(SELECT 1 FROM ordens_porta_social WHERE pedido_id = p_pedido_id) THEN
      SELECT gerar_numero_ordem('porta_social') INTO v_numero_ordem_porta_social;
      INSERT INTO ordens_porta_social (pedido_id, numero_ordem, status, em_backlog, prioridade)
      VALUES (p_pedido_id, v_numero_ordem_porta_social, 'pendente', COALESCE(v_pedido_em_backlog, false), COALESCE(v_pedido_prioridade, 0))
      RETURNING id INTO v_ordem_porta_social_id;
    ELSE
      SELECT id INTO v_ordem_porta_social_id FROM ordens_porta_social WHERE pedido_id = p_pedido_id LIMIT 1;
    END IF;
  END IF;

  -- Criar linhas de ordens baseadas nas linhas do pedido
  FOR v_linha IN
    SELECT 
      pl.id as pedido_linha_id,
      pl.produto as item,
      pl.quantidade,
      pl.largura,
      pl.altura,
      pl.estoque_id,
      pl.categoria_linha,
      pl.indice_porta,
      COALESCE(e.setor_responsavel_producao::text, 
        CASE pl.categoria_linha
          WHEN 'solda' THEN 'soldagem'
          WHEN 'perfiladeira' THEN 'perfiladeira'
          WHEN 'separacao' THEN 'separacao'
          ELSE NULL
        END
      ) as setor
    FROM pedido_linhas pl
    LEFT JOIN estoque e ON pl.estoque_id = e.id
    WHERE pl.pedido_id = p_pedido_id
  LOOP
    IF v_linha.setor = 'soldagem' AND v_ordem_solda_id IS NOT NULL THEN
      IF NOT EXISTS(SELECT 1 FROM linhas_ordens WHERE ordem_id = v_ordem_solda_id AND pedido_linha_id = v_linha.pedido_linha_id AND tipo_ordem = 'soldagem') THEN
        INSERT INTO linhas_ordens (ordem_id, pedido_id, pedido_linha_id, tipo_ordem, item, quantidade, largura, altura, estoque_id, indice_porta)
        VALUES (v_ordem_solda_id, p_pedido_id, v_linha.pedido_linha_id, 'soldagem', v_linha.item, COALESCE(v_linha.quantidade, 1), v_linha.largura, v_linha.altura, v_linha.estoque_id, v_linha.indice_porta);
      END IF;
    ELSIF v_linha.setor = 'perfiladeira' AND v_ordem_perfil_id IS NOT NULL THEN
      IF NOT EXISTS(SELECT 1 FROM linhas_ordens WHERE ordem_id = v_ordem_perfil_id AND pedido_linha_id = v_linha.pedido_linha_id AND tipo_ordem = 'perfiladeira') THEN
        INSERT INTO linhas_ordens (ordem_id, pedido_id, pedido_linha_id, tipo_ordem, item, quantidade, largura, altura, estoque_id, indice_porta)
        VALUES (v_ordem_perfil_id, p_pedido_id, v_linha.pedido_linha_id, 'perfiladeira', v_linha.item, COALESCE(v_linha.quantidade, 1), v_linha.largura, v_linha.altura, v_linha.estoque_id, v_linha.indice_porta);
      END IF;
    ELSIF v_linha.setor = 'separacao' AND v_ordem_separacao_id IS NOT NULL THEN
      IF NOT EXISTS(SELECT 1 FROM linhas_ordens WHERE ordem_id = v_ordem_separacao_id AND pedido_linha_id = v_linha.pedido_linha_id AND tipo_ordem = 'separacao') THEN
        INSERT INTO linhas_ordens (ordem_id, pedido_id, pedido_linha_id, tipo_ordem, item, quantidade, largura, altura, estoque_id, indice_porta)
        VALUES (v_ordem_separacao_id, p_pedido_id, v_linha.pedido_linha_id, 'separacao', v_linha.item, COALESCE(v_linha.quantidade, 1), v_linha.largura, v_linha.altura, v_linha.estoque_id, v_linha.indice_porta);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- Adicionar rota na tabela app_routes
-- ============================================
INSERT INTO app_routes (key, path, label, icon, interface, sort_order, active)
VALUES ('producao_terceirizacao', '/producao/terceirizacao', 'Terceirização', 'Package', 'producao', 35, true)
ON CONFLICT (key) DO UPDATE SET 
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  interface = EXCLUDED.interface,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;