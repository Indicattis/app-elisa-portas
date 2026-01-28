-- Limpar dados órfãos do pedido 537c9681-7b96-4477-9897-81a4bf3d38e4
DELETE FROM linhas_ordens 
WHERE pedido_id = '537c9681-7b96-4477-9897-81a4bf3d38e4' 
  AND tipo_ordem IN ('qualidade', 'pintura');

DELETE FROM ordens_qualidade 
WHERE pedido_id = '537c9681-7b96-4477-9897-81a4bf3d38e4';

DELETE FROM ordens_pintura 
WHERE pedido_id = '537c9681-7b96-4477-9897-81a4bf3d38e4';

-- Atualizar função de retorno para produção com suporte a configuração de ordens
CREATE OR REPLACE FUNCTION retornar_pedido_para_producao(
  p_pedido_id UUID,
  p_ordem_qualidade_id UUID,
  p_motivo TEXT,
  p_ordens_config JSONB,
  p_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config JSONB;
  v_tipo TEXT;
  v_acao TEXT;
  v_justificativa TEXT;
BEGIN
  -- Validações
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;

  -- 1. EXCLUIR ORDEM DE QUALIDADE E SUAS LINHAS
  DELETE FROM linhas_ordens 
  WHERE pedido_id = p_pedido_id AND tipo_ordem = 'qualidade';
  
  DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;

  -- 2. EXCLUIR ORDEM DE PINTURA E SUAS LINHAS
  DELETE FROM linhas_ordens 
  WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
  
  DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;

  -- 3. PROCESSAR CADA ORDEM DE PRODUÇÃO CONFORME CONFIGURAÇÃO
  FOR v_config IN SELECT * FROM jsonb_array_elements(p_ordens_config)
  LOOP
    v_tipo := v_config->>'tipo';
    v_acao := v_config->>'acao';
    v_justificativa := v_config->>'justificativa';

    IF v_acao = 'pausar' THEN
      -- PAUSAR: Define status pausada com justificativa
      IF v_tipo = 'soldagem' THEN
        UPDATE ordens_soldagem 
        SET status = 'pausada',
            pausada = true,
            pausada_em = now(),
            justificativa_pausa = COALESCE(v_justificativa, p_motivo),
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
      ELSIF v_tipo = 'perfiladeira' THEN
        UPDATE ordens_perfiladeira 
        SET status = 'pausada',
            pausada = true,
            pausada_em = now(),
            justificativa_pausa = COALESCE(v_justificativa, p_motivo),
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
      ELSIF v_tipo = 'separacao' THEN
        UPDATE ordens_separacao 
        SET status = 'pausada',
            pausada = true,
            pausada_em = now(),
            justificativa_pausa = COALESCE(v_justificativa, p_motivo),
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
      END IF;

    ELSIF v_acao = 'reativar' THEN
      -- REATIVAR: Define status pendente, limpa conclusão, marca backlog
      IF v_tipo = 'soldagem' THEN
        UPDATE ordens_soldagem 
        SET status = 'pendente',
            historico = false,
            em_backlog = true,
            pausada = false,
            pausada_em = NULL,
            justificativa_pausa = NULL,
            responsavel_id = NULL,
            data_conclusao = NULL,
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
        
        UPDATE linhas_ordens 
        SET concluida = false, concluida_em = NULL, concluida_por = NULL
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'soldagem';

      ELSIF v_tipo = 'perfiladeira' THEN
        UPDATE ordens_perfiladeira 
        SET status = 'pendente',
            historico = false,
            em_backlog = true,
            pausada = false,
            pausada_em = NULL,
            justificativa_pausa = NULL,
            responsavel_id = NULL,
            data_conclusao = NULL,
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
        
        UPDATE linhas_ordens 
        SET concluida = false, concluida_em = NULL, concluida_por = NULL
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'perfiladeira';

      ELSIF v_tipo = 'separacao' THEN
        UPDATE ordens_separacao 
        SET status = 'pendente',
            historico = false,
            em_backlog = true,
            pausada = false,
            pausada_em = NULL,
            justificativa_pausa = NULL,
            responsavel_id = NULL,
            data_conclusao = NULL,
            updated_at = now()
        WHERE pedido_id = p_pedido_id;
        
        UPDATE linhas_ordens 
        SET concluida = false, concluida_em = NULL, concluida_por = NULL
        WHERE pedido_id = p_pedido_id AND tipo_ordem = 'separacao';
      END IF;
    END IF;
    -- 'manter' não faz nada - mantém status atual
  END LOOP;

  -- 4. ATUALIZAR ETAPAS - Fechar etapa atual e criar nova em_producao
  UPDATE pedidos_etapas 
  SET data_saida = now()
  WHERE pedido_id = p_pedido_id 
    AND data_saida IS NULL;

  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (p_pedido_id, 'em_producao', now(), '[]'::jsonb);

  -- 5. ATUALIZAR PEDIDO
  UPDATE pedidos_producao 
  SET etapa_atual = 'em_producao',
      em_backlog = true,
      observacoes = COALESCE(observacoes, '') || 
        E'\n\n[RETORNO QUALIDADE ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ']: ' || p_motivo,
      updated_at = now()
  WHERE id = p_pedido_id;
END;
$$;