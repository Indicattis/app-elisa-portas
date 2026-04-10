
-- Overload 1: text[] version
CREATE OR REPLACE FUNCTION public.retornar_pedido_para_producao(
  p_pedido_id uuid,
  p_ordem_qualidade_id uuid,
  p_motivo text,
  p_ordens_reativar text[],
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tipo TEXT;
  v_tabela TEXT;
  v_etapa_atual TEXT;
BEGIN
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;

  IF p_ordens_reativar IS NULL OR array_length(p_ordens_reativar, 1) IS NULL THEN
    RAISE EXCEPTION 'Selecione pelo menos uma ordem para reativar';
  END IF;

  -- Capturar etapa atual antes de alterar
  SELECT etapa_atual INTO v_etapa_atual FROM pedidos_producao WHERE id = p_pedido_id;

  DELETE FROM linhas_ordens 
  WHERE ordem_id = p_ordem_qualidade_id AND tipo_ordem = 'qualidade';

  DELETE FROM ordens_qualidade WHERE id = p_ordem_qualidade_id;

  FOREACH v_tipo IN ARRAY p_ordens_reativar
  LOOP
    v_tabela := 'ordens_' || v_tipo;
    
    IF v_tipo = 'soldagem' THEN
      UPDATE ordens_soldagem 
      SET status = 'pendente', historico = false, em_backlog = true,
          responsavel_id = NULL, data_conclusao = NULL, updated_at = now()
      WHERE pedido_id = p_pedido_id;
      UPDATE linhas_ordens 
      SET concluida = false, concluida_em = NULL, concluida_por = NULL
      WHERE pedido_id = p_pedido_id AND tipo_ordem = 'soldagem';
    ELSIF v_tipo = 'perfiladeira' THEN
      UPDATE ordens_perfiladeira 
      SET status = 'pendente', historico = false, em_backlog = true,
          responsavel_id = NULL, data_conclusao = NULL, updated_at = now()
      WHERE pedido_id = p_pedido_id;
      UPDATE linhas_ordens 
      SET concluida = false, concluida_em = NULL, concluida_por = NULL
      WHERE pedido_id = p_pedido_id AND tipo_ordem = 'perfiladeira';
    ELSIF v_tipo = 'separacao' THEN
      UPDATE ordens_separacao 
      SET status = 'pendente', historico = false, em_backlog = true,
          responsavel_id = NULL, data_conclusao = NULL, updated_at = now()
      WHERE pedido_id = p_pedido_id;
      UPDATE linhas_ordens 
      SET concluida = false, concluida_em = NULL, concluida_por = NULL
      WHERE pedido_id = p_pedido_id AND tipo_ordem = 'separacao';
    END IF;
  END LOOP;

  -- Registrar movimentação no histórico
  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (p_pedido_id, COALESCE(v_etapa_atual, 'inspecao_qualidade'), 'em_producao', p_user_id, 'backlog', p_motivo);

  UPDATE pedidos_etapas 
  SET data_saida = now()
  WHERE pedido_id = p_pedido_id 
    AND etapa = 'inspecao_qualidade' 
    AND data_saida IS NULL;

  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (p_pedido_id, 'em_producao', now(), '[]'::jsonb)
  ON CONFLICT (pedido_id, etapa) DO UPDATE SET
    data_entrada = now(),
    data_saida = NULL,
    checkboxes = '[]'::jsonb;

  UPDATE pedidos_producao 
  SET etapa_atual = 'em_producao',
      em_backlog = true,
      observacoes = COALESCE(observacoes, '') || E'\n\n[RETORNO QUALIDADE ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ']: ' || p_motivo,
      updated_at = now()
  WHERE id = p_pedido_id;
END;
$function$;

-- Overload 2: jsonb version
CREATE OR REPLACE FUNCTION public.retornar_pedido_para_producao(
  p_pedido_id uuid,
  p_ordem_qualidade_id uuid,
  p_motivo text,
  p_ordens_config jsonb,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_config JSONB;
  v_tipo TEXT;
  v_acao TEXT;
  v_justificativa TEXT;
  v_etapa_atual TEXT;
BEGIN
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;

  -- Capturar etapa atual antes de alterar
  SELECT etapa_atual INTO v_etapa_atual FROM pedidos_producao WHERE id = p_pedido_id;

  DELETE FROM linhas_ordens 
  WHERE pedido_id = p_pedido_id AND tipo_ordem = 'qualidade';
  DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;

  DELETE FROM linhas_ordens 
  WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
  DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;

  FOR v_config IN SELECT * FROM jsonb_array_elements(p_ordens_config)
  LOOP
    v_tipo := v_config->>'tipo';
    v_acao := v_config->>'acao';
    v_justificativa := v_config->>'justificativa';

    IF v_acao = 'pausar' THEN
      IF v_tipo = 'soldagem' THEN
        UPDATE ordens_soldagem 
        SET status = 'pausada', pausada = true, pausada_em = now(),
            justificativa_pausa = COALESCE(v_justificativa, p_motivo), updated_at = now()
        WHERE pedido_id = p_pedido_id;
      ELSIF v_tipo = 'perfiladeira' THEN
        UPDATE ordens_perfiladeira 
        SET status = 'pausada', pausada = true, pausada_em = now(),
            justificativa_pausa = COALESCE(v_justificativa, p_motivo), updated_at = now()
        WHERE pedido_id = p_pedido_id;
      ELSIF v_tipo = 'separacao' THEN
        UPDATE ordens_separacao 
        SET status = 'pausada', pausada = true, pausada_em = now(),
            justificativa_pausa = COALESCE(v_justificativa, p_motivo), updated_at = now()
        WHERE pedido_id = p_pedido_id;
      END IF;
    ELSIF v_acao = 'reativar' THEN
      IF v_tipo = 'soldagem' THEN
        UPDATE ordens_soldagem 
        SET status = 'pendente', historico = false, em_backlog = true,
            pausada = false, pausada_em = NULL, justificativa_pausa = NULL,
            responsavel_id = NULL, data_conclusao = NULL, updated_at = now()
        WHERE pedido_id = p_pedido_id;
        UPDATE linhas_ordens 
        SET concluida = false, concluida_em = NULL, concluida_por = NULL
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'soldagem';
      ELSIF v_tipo = 'perfiladeira' THEN
        UPDATE ordens_perfiladeira 
        SET status = 'pendente', historico = false, em_backlog = true,
            pausada = false, pausada_em = NULL, justificativa_pausa = NULL,
            responsavel_id = NULL, data_conclusao = NULL, updated_at = now()
        WHERE pedido_id = p_pedido_id;
        UPDATE linhas_ordens 
        SET concluida = false, concluida_em = NULL, concluida_por = NULL
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'perfiladeira';
      ELSIF v_tipo = 'separacao' THEN
        UPDATE ordens_separacao 
        SET status = 'pendente', historico = false, em_backlog = true,
            pausada = false, pausada_em = NULL, justificativa_pausa = NULL,
            responsavel_id = NULL, data_conclusao = NULL, updated_at = now()
        WHERE pedido_id = p_pedido_id;
        UPDATE linhas_ordens 
        SET concluida = false, concluida_em = NULL, concluida_por = NULL
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'separacao';
      END IF;
    END IF;
  END LOOP;

  -- Registrar movimentação no histórico
  INSERT INTO pedidos_movimentacoes (pedido_id, etapa_origem, etapa_destino, user_id, teor, descricao)
  VALUES (p_pedido_id, COALESCE(v_etapa_atual, 'inspecao_qualidade'), 'em_producao', p_user_id, 'backlog', p_motivo);

  UPDATE pedidos_etapas 
  SET data_saida = now()
  WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;

  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (p_pedido_id, 'em_producao', now(), '[]'::jsonb)
  ON CONFLICT (pedido_id, etapa) DO UPDATE SET
    data_entrada = now(),
    data_saida = NULL,
    checkboxes = '[]'::jsonb;

  UPDATE pedidos_producao 
  SET etapa_atual = 'em_producao',
      em_backlog = true,
      observacoes = COALESCE(observacoes, '') || 
        E'\n\n[RETORNO QUALIDADE ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ']: ' || p_motivo,
      updated_at = now()
  WHERE id = p_pedido_id;
END;
$function$;
