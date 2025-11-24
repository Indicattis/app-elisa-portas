-- ================================================
-- REFATORAÇÃO COMPLETA: INSTALAÇÕES → ORDENS DE CARREGAMENTO
-- ================================================

-- 1. Renomear tabela instalacoes para ordens_carregamento
ALTER TABLE instalacoes RENAME TO ordens_carregamento;

-- 2. Renomear colunas relacionadas a instalação para carregamento
ALTER TABLE ordens_carregamento 
  RENAME COLUMN data_instalacao TO data_carregamento;

ALTER TABLE ordens_carregamento 
  RENAME COLUMN instalacao_concluida TO carregamento_concluido;

ALTER TABLE ordens_carregamento 
  RENAME COLUMN instalacao_concluida_em TO carregamento_concluido_em;

ALTER TABLE ordens_carregamento 
  RENAME COLUMN instalacao_concluida_por TO carregamento_concluido_por;

-- 3. Adicionar coluna hora_carregamento
ALTER TABLE ordens_carregamento ADD COLUMN IF NOT EXISTS hora_carregamento time;

-- Migrar dados da coluna 'hora' para 'hora_carregamento'
UPDATE ordens_carregamento 
SET hora_carregamento = hora 
WHERE hora IS NOT NULL AND hora_carregamento IS NULL;

-- 4. Renomear enum e coluna tipo_instalacao
-- Criar novo tipo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_carregamento') THEN
    CREATE TYPE tipo_carregamento AS ENUM ('elisa', 'autorizados');
  END IF;
END$$;

-- Alterar coluna para usar novo tipo
ALTER TABLE ordens_carregamento 
  ALTER COLUMN tipo_instalacao TYPE tipo_carregamento 
  USING tipo_instalacao::text::tipo_carregamento;

-- Renomear coluna
ALTER TABLE ordens_carregamento 
  RENAME COLUMN tipo_instalacao TO tipo_carregamento;

-- 5. Renomear colunas de responsável
ALTER TABLE ordens_carregamento 
  RENAME COLUMN responsavel_instalacao_id TO responsavel_carregamento_id;

ALTER TABLE ordens_carregamento 
  RENAME COLUMN responsavel_instalacao_nome TO responsavel_carregamento_nome;

-- 6. Criar função para concluir ordem de carregamento e avançar pedido
CREATE OR REPLACE FUNCTION concluir_ordem_carregamento(
  p_ordem_id UUID
) RETURNS VOID AS $func$
DECLARE
  v_pedido_id UUID;
  v_etapa_atual TEXT;
BEGIN
  -- Buscar pedido_id
  SELECT pedido_id INTO v_pedido_id
  FROM ordens_carregamento
  WHERE id = p_ordem_id;
  
  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Ordem de carregamento não encontrada ou sem pedido associado';
  END IF;
  
  -- Buscar etapa atual do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;
  
  -- Validar que está em etapa de expedição
  IF v_etapa_atual NOT IN ('aguardando_coleta', 'aguardando_instalacao') THEN
    RAISE EXCEPTION 'Pedido não está em etapa de expedição';
  END IF;
  
  -- Marcar ordem como concluída
  UPDATE ordens_carregamento
  SET carregamento_concluido = TRUE,
      carregamento_concluido_em = NOW(),
      carregamento_concluido_por = auth.uid(),
      updated_at = NOW()
  WHERE id = p_ordem_id;
  
  -- Fechar etapa atual
  UPDATE pedidos_etapas
  SET data_saida = NOW()
  WHERE pedido_id = v_pedido_id
  AND etapa = v_etapa_atual
  AND data_saida IS NULL;
  
  -- Criar etapa "finalizado"
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
  VALUES (v_pedido_id, 'finalizado', NOW());
  
  -- Atualizar pedido
  UPDATE pedidos_producao
  SET etapa_atual = 'finalizado',
      status = 'concluido',
      updated_at = NOW()
  WHERE id = v_pedido_id;
  
  -- Registrar movimentação
  INSERT INTO pedidos_movimentacoes (
    pedido_id,
    etapa_origem,
    etapa_destino,
    realizado_por,
    observacoes
  ) VALUES (
    v_pedido_id,
    v_etapa_atual,
    'finalizado',
    auth.uid(),
    'Carregamento concluído automaticamente'
  );
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atualizar RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view instalacoes" ON ordens_carregamento;
DROP POLICY IF EXISTS "Authenticated users can insert instalacoes" ON ordens_carregamento;
DROP POLICY IF EXISTS "Authenticated users can update instalacoes" ON ordens_carregamento;
DROP POLICY IF EXISTS "Authenticated users can delete instalacoes" ON ordens_carregamento;

CREATE POLICY "Authenticated users can view ordens_carregamento"
  ON ordens_carregamento FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ordens_carregamento"
  ON ordens_carregamento FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ordens_carregamento"
  ON ordens_carregamento FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ordens_carregamento"
  ON ordens_carregamento FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 8. Atualizar triggers (se existirem)
-- Renomear trigger de geocode se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_geocode_instalacao'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_geocode_instalacao ON ordens_carregamento;
  END IF;
END$$;

-- 9. Comentários para documentação
COMMENT ON TABLE ordens_carregamento IS 'Ordens de carregamento para entregas e instalações';
COMMENT ON COLUMN ordens_carregamento.data_carregamento IS 'Data programada para carregamento';
COMMENT ON COLUMN ordens_carregamento.hora_carregamento IS 'Hora programada para carregamento';
COMMENT ON COLUMN ordens_carregamento.tipo_carregamento IS 'Tipo de responsável: elisa (equipe interna) ou autorizados';
COMMENT ON COLUMN ordens_carregamento.carregamento_concluido IS 'Indica se o carregamento foi concluído';
COMMENT ON COLUMN ordens_carregamento.carregamento_concluido_em IS 'Data e hora da conclusão do carregamento';
COMMENT ON FUNCTION concluir_ordem_carregamento IS 'Conclui uma ordem de carregamento e avança o pedido para finalizado';