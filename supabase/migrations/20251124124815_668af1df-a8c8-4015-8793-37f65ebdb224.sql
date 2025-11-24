-- Criar tabela de histórico de movimentações de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  etapa_origem TEXT,
  etapa_destino TEXT NOT NULL,
  teor TEXT NOT NULL CHECK (teor IN ('avanco', 'backlog', 'reorganizacao', 'criacao')),
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_movimentacoes_pedido ON public.pedidos_movimentacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_movimentacoes_teor ON public.pedidos_movimentacoes(teor);
CREATE INDEX IF NOT EXISTS idx_pedidos_movimentacoes_data ON public.pedidos_movimentacoes(data_hora DESC);

-- RLS Policies
ALTER TABLE public.pedidos_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movimentacoes"
  ON public.pedidos_movimentacoes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert movimentacoes"
  ON public.pedidos_movimentacoes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Criar view para backlog ativo
CREATE OR REPLACE VIEW public.pedidos_backlog_ativo AS
SELECT DISTINCT ON (p.id)
  p.id as pedido_id,
  p.numero_pedido,
  p.etapa_atual,
  pm.etapa_origem as etapa_origem_backlog,
  pm.descricao as motivo_backlog,
  pm.data_hora as data_backlog,
  pm.user_id as usuario_backlog,
  au.nome as usuario_nome
FROM public.pedidos_producao p
INNER JOIN public.pedidos_movimentacoes pm ON p.id = pm.pedido_id
LEFT JOIN public.admin_users au ON pm.user_id = au.user_id
WHERE pm.teor = 'backlog'
  AND NOT EXISTS (
    SELECT 1 FROM public.pedidos_movimentacoes pm2
    WHERE pm2.pedido_id = p.id
      AND pm2.data_hora > pm.data_hora
      AND pm2.teor = 'avanco'
  )
ORDER BY p.id, pm.data_hora DESC;

-- Atualizar função retroceder_pedido_para_etapa para registrar movimentação
CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid,
  p_etapa_destino text,
  p_motivo_backlog text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_etapa_atual text;
  v_max_prioridade integer;
BEGIN
  -- Obter etapa atual
  SELECT etapa_atual INTO v_etapa_atual 
  FROM pedidos_producao 
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_pedido_id;
  END IF;

  -- Registrar movimentação no histórico
  INSERT INTO public.pedidos_movimentacoes (
    pedido_id,
    user_id,
    etapa_origem,
    etapa_destino,
    teor,
    descricao,
    data_hora
  ) VALUES (
    p_pedido_id,
    auth.uid(),
    v_etapa_atual,
    p_etapa_destino,
    'backlog',
    p_motivo_backlog,
    NOW()
  );

  -- Obter maior prioridade da etapa de destino
  SELECT COALESCE(MAX(prioridade_etapa), 0) INTO v_max_prioridade
  FROM pedidos_producao 
  WHERE etapa_atual = p_etapa_destino;

  RAISE LOG '[retroceder] Pedido: %, Etapa atual: %, Destino: %', p_pedido_id, v_etapa_atual, p_etapa_destino;

  -- Continuar com lógica de retrocesso existente...
  IF p_etapa_destino = 'aberto' THEN
    RAISE LOG '[retroceder] CASO 1: Excluindo TUDO (ordens, linhas, instalações, entregas)';
    
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes_cadastradas WHERE pedido_id = p_pedido_id;
    DELETE FROM entregas WHERE pedido_id = p_pedido_id;
    
    RAISE LOG '[retroceder] Tudo excluído para pedido %', p_pedido_id;

  ELSIF p_etapa_destino = 'em_producao' THEN
    RAISE LOG '[retroceder] CASO 2: MANTER ordens de produção base, EXCLUIR qualidade e pintura';
    
    DELETE FROM linhas_ordens 
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('qualidade', 'pintura');
    
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_soldagem 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE linhas_ordens
    SET concluida = false, concluida_em = NULL, concluida_por = NULL
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao');
    
    UPDATE instalacoes_cadastradas
    SET status = 'em_producao'
    WHERE pedido_id = p_pedido_id;

  ELSIF p_etapa_destino = 'inspecao_qualidade' THEN
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_qualidade 
    SET status = 'pendente',
        em_backlog = true,
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;

  ELSIF p_etapa_destino = 'aguardando_pintura' THEN
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
  END IF;

  -- Fechar etapas abertas
  UPDATE pedidos_etapas 
  SET data_saida = NOW() 
  WHERE pedido_id = p_pedido_id 
  AND data_saida IS NULL;

  -- Criar nova etapa destino
  INSERT INTO pedidos_etapas (pedido_id, etapa)
  SELECT p_pedido_id, p_etapa_destino
  WHERE NOT EXISTS (
    SELECT 1 FROM pedidos_etapas 
    WHERE pedido_id = p_pedido_id 
    AND etapa = p_etapa_destino 
    AND data_saida IS NULL
  );

  -- Atualizar pedido
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino,
    status = CASE 
      WHEN p_etapa_destino = 'aberto' THEN 'pendente'
      ELSE 'em_andamento'
    END,
    em_backlog = true,
    motivo_backlog = p_motivo_backlog,
    data_backlog = NOW(),
    etapa_origem_backlog = v_etapa_atual,
    prioridade_etapa = v_max_prioridade + 1000,
    updated_at = NOW()
  WHERE id = p_pedido_id;
  
END;
$function$;

-- Atualizar trigger para usar a view
CREATE OR REPLACE FUNCTION public.sync_ordens_prioridade_backlog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_em_backlog BOOLEAN;
BEGIN
  -- Verificar se existe entrada na view pedidos_backlog_ativo
  SELECT EXISTS (
    SELECT 1 FROM public.pedidos_backlog_ativo WHERE pedido_id = NEW.id
  ) INTO v_em_backlog;
  
  -- Atualizar todas as ordens do pedido
  UPDATE ordens_soldagem 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = v_em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_perfiladeira 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = v_em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_separacao 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = v_em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_qualidade 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = v_em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_pintura 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = v_em_backlog
  WHERE pedido_id = NEW.id;

  RETURN NEW;
END;
$function$;