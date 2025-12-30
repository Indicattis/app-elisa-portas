-- Corrigir a função retroceder_pedido_para_etapa (versão 4 parâmetros)
-- O problema era que usava nomes de colunas incorretos na tabela pedidos_movimentacoes

CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid,
  p_etapa_destino text,
  p_user_id uuid,
  p_motivo_backlog text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_etapa_atual text;
  v_pedido_status text;
BEGIN
  -- Buscar etapa atual do pedido
  SELECT etapa_atual, status INTO v_etapa_atual, v_pedido_status
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  -- Se estiver retrocedendo para 'aberto', deletar todas as ordens e pontuações
  IF p_etapa_destino = 'aberto' THEN
    -- Deletar pontuações associadas às linhas de ordens
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = p_pedido_id);
    
    -- Deletar linhas de ordens
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    
    -- Deletar todas as ordens de produção
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_porta_social WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_coleta WHERE pedido_id = p_pedido_id;
    
    -- Deletar instalação se existir
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
  END IF;

  -- Atualizar a etapa atual do pedido
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino,
    status = CASE 
      WHEN p_etapa_destino = 'aberto' THEN 'pendente'
      ELSE status 
    END,
    em_backlog = CASE 
      WHEN p_etapa_destino = 'aberto' THEN false
      ELSE em_backlog 
    END,
    updated_at = now()
  WHERE id = p_pedido_id;

  -- Registrar movimentação com os nomes CORRETOS das colunas
  INSERT INTO pedidos_movimentacoes (
    pedido_id,
    etapa_origem,
    etapa_destino,
    user_id,
    teor,
    descricao
  ) VALUES (
    p_pedido_id,
    v_etapa_atual,
    p_etapa_destino,
    p_user_id,
    'backlog',
    COALESCE(p_motivo_backlog, 'Retrocesso de etapa')
  );

  RETURN jsonb_build_object(
    'success', true, 
    'etapa_anterior', v_etapa_atual,
    'etapa_nova', p_etapa_destino
  );

EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[retroceder_pedido_para_etapa] Erro ao retroceder pedido %: %', p_pedido_id, SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Limpar dados órfãos do pedido afetado
DELETE FROM pontuacao_colaboradores 
WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71');

DELETE FROM linhas_ordens WHERE pedido_id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';

DELETE FROM ordens_soldagem WHERE pedido_id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';
DELETE FROM ordens_perfiladeira WHERE pedido_id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';
DELETE FROM ordens_separacao WHERE pedido_id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';

UPDATE pedidos_producao 
SET status = 'pendente', em_backlog = false
WHERE id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';