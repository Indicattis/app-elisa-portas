
-- 1. Criar tabela ordens_embalagem
CREATE TABLE public.ordens_embalagem (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  numero_ordem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel_id UUID,
  capturada_em TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  tempo_conclusao_segundos INTEGER,
  historico BOOLEAN NOT NULL DEFAULT false,
  prioridade INTEGER NOT NULL DEFAULT 0,
  em_backlog BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.ordens_embalagem ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (mesmo padrão de ordens_pintura)
CREATE POLICY "Ordens embalagem visíveis para autenticados"
  ON public.ordens_embalagem FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Ordens embalagem inseríveis por autenticados"
  ON public.ordens_embalagem FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Ordens embalagem atualizáveis por autenticados"
  ON public.ordens_embalagem FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Ordens embalagem deletáveis por autenticados"
  ON public.ordens_embalagem FOR DELETE
  TO authenticated
  USING (true);

-- 4. Índices
CREATE INDEX idx_ordens_embalagem_pedido_id ON public.ordens_embalagem(pedido_id);
CREATE INDEX idx_ordens_embalagem_status ON public.ordens_embalagem(status);
CREATE INDEX idx_ordens_embalagem_historico ON public.ordens_embalagem(historico);

-- 5. Trigger de updated_at
CREATE TRIGGER update_ordens_embalagem_updated_at
  BEFORE UPDATE ON public.ordens_embalagem
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Função criar_ordem_embalagem
CREATE OR REPLACE FUNCTION public.criar_ordem_embalagem(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero_ordem TEXT;
  v_ordem_id UUID;
  v_linha RECORD;
BEGIN
  -- Verificar se já existe uma ordem de embalagem ativa para este pedido
  IF EXISTS (
    SELECT 1 FROM ordens_embalagem 
    WHERE pedido_id = p_pedido_id AND historico = false
  ) THEN
    RAISE NOTICE 'Ordem de embalagem já existe para o pedido %', p_pedido_id;
    RETURN;
  END IF;

  -- Gerar número da ordem
  v_numero_ordem := 'OEM-' || to_char(now(), 'YYYY') || '-' || substr(p_pedido_id::text, 1, 8);

  -- Criar a ordem
  INSERT INTO ordens_embalagem (pedido_id, numero_ordem, status)
  VALUES (p_pedido_id, v_numero_ordem, 'pendente')
  RETURNING id INTO v_ordem_id;

  -- Copiar linhas do pedido para linhas_ordens com tipo_ordem = 'embalagem'
  FOR v_linha IN
    SELECT pl.nome_produto, pl.quantidade, pl.tamanho, pl.estoque_id, pl.produto_venda_id
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id
  LOOP
    INSERT INTO linhas_ordens (
      ordem_id, pedido_id, tipo_ordem, item, quantidade, tamanho, estoque_id, produto_venda_id, concluida
    ) VALUES (
      v_ordem_id, p_pedido_id, 'embalagem', v_linha.nome_produto, v_linha.quantidade, v_linha.tamanho, v_linha.estoque_id, v_linha.produto_venda_id, false
    );
  END LOOP;

  RAISE NOTICE 'Ordem de embalagem % criada com sucesso', v_numero_ordem;
END;
$$;

-- 7. Atualizar retroceder_pedido_unificado para conhecer embalagem
-- Primeiro verificar a função existente e adicionar suporte
CREATE OR REPLACE FUNCTION public.retroceder_pedido_unificado(
  p_pedido_id UUID,
  p_etapa_destino TEXT,
  p_motivo TEXT DEFAULT '',
  p_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_etapa_atual TEXT;
  v_ordem_etapas TEXT[] := ARRAY[
    'aberto', 'aprovacao_ceo', 'em_producao', 'inspecao_qualidade', 
    'aguardando_pintura', 'embalagem', 'aguardando_coleta', 'instalacoes', 'correcoes', 'finalizado'
  ];
  v_idx_atual INTEGER;
  v_idx_destino INTEGER;
  v_etapa TEXT;
BEGIN
  -- Buscar etapa atual
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- Encontrar índices
  v_idx_atual := array_position(v_ordem_etapas, v_etapa_atual);
  v_idx_destino := array_position(v_ordem_etapas, p_etapa_destino);

  IF v_idx_atual IS NULL OR v_idx_destino IS NULL THEN
    RAISE EXCEPTION 'Etapa inválida: atual=%, destino=%', v_etapa_atual, p_etapa_destino;
  END IF;

  IF v_idx_destino >= v_idx_atual THEN
    RAISE EXCEPTION 'A etapa destino deve ser anterior à etapa atual';
  END IF;

  -- Fechar etapa atual
  UPDATE pedidos_etapas
  SET data_saida = now()
  WHERE pedido_id = p_pedido_id AND etapa = v_etapa_atual AND data_saida IS NULL;

  -- Para cada etapa intermediária (da atual até destino+1), excluir ordens relacionadas
  FOR i IN REVERSE v_idx_atual..v_idx_destino+1 LOOP
    v_etapa := v_ordem_etapas[i];
    
    -- Excluir ordens de produção se retrocedendo antes de em_producao
    IF v_etapa = 'em_producao' THEN
      DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao');
      DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
      DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
      DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
      DELETE FROM ordens_porta_social WHERE pedido_id = p_pedido_id;
    END IF;
    
    IF v_etapa = 'inspecao_qualidade' THEN
      DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'qualidade';
      DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    END IF;
    
    IF v_etapa = 'aguardando_pintura' THEN
      -- Verificar se realmente tem pintura antes de excluir
      IF EXISTS (
        SELECT 1 FROM produtos_vendas pv
        JOIN pedidos_producao pp ON pp.venda_id = pv.venda_id
        WHERE pp.id = p_pedido_id AND pv.valor_pintura > 0
      ) THEN
        DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
        DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
      END IF;
    END IF;

    IF v_etapa = 'embalagem' THEN
      DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'embalagem';
      DELETE FROM ordens_embalagem WHERE pedido_id = p_pedido_id;
    END IF;
    
    IF v_etapa IN ('aguardando_coleta', 'instalacoes') THEN
      DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    END IF;
  END LOOP;

  -- Reativar etapa destino (UPSERT)
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, data_saida, checkboxes)
  VALUES (p_pedido_id, p_etapa_destino, now(), NULL, '[]'::jsonb)
  ON CONFLICT (pedido_id, etapa)
  DO UPDATE SET
    data_entrada = now(),
    data_saida = NULL,
    checkboxes = '[]'::jsonb;

  -- Registrar movimentação
  INSERT INTO pedidos_movimentacoes (pedido_id, user_id, etapa_origem, etapa_destino, teor, descricao)
  VALUES (p_pedido_id, p_user_id, v_etapa_atual, p_etapa_destino, 'retrocesso', p_motivo);

  -- Atualizar pedido (FINAL - prevalece sobre trigger)
  UPDATE pedidos_producao
  SET etapa_atual = p_etapa_destino,
      prioridade_etapa = 0
  WHERE id = p_pedido_id;
END;
$$;
