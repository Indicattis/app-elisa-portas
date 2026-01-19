-- 1. MIGRAR PONTUAÇÕES: Atualizar referências de linhas antigas para linhas novas
-- (quando existe uma linha nova com pedido_linha_id)
UPDATE pontuacao_colaboradores pc
SET linha_id = lo_new.id
FROM linhas_ordens lo_old
JOIN linhas_ordens lo_new ON lo_new.ordem_id = lo_old.ordem_id
  AND lo_new.item = lo_old.item
  AND lo_new.quantidade = lo_old.quantidade
  AND COALESCE(lo_new.tamanho, '') = COALESCE(lo_old.tamanho, '')
  AND lo_new.pedido_linha_id IS NOT NULL
WHERE pc.linha_id = lo_old.id
  AND lo_old.pedido_linha_id IS NULL;

-- 2. LIMPEZA: Remover linhas antigas SEM pedido_linha_id onde já existe uma linha COM pedido_linha_id
DELETE FROM linhas_ordens lo_old
WHERE lo_old.pedido_linha_id IS NULL
AND EXISTS (
  SELECT 1 FROM linhas_ordens lo_new
  WHERE lo_new.ordem_id = lo_old.ordem_id
  AND lo_new.item = lo_old.item
  AND lo_new.quantidade = lo_old.quantidade
  AND COALESCE(lo_new.tamanho, '') = COALESCE(lo_old.tamanho, '')
  AND lo_new.pedido_linha_id IS NOT NULL
);

-- 3. LIMPEZA ADICIONAL: Para linhas onde AMBAS não têm pedido_linha_id, 
-- manter a mais recente E também manter QUALQUER linha que tenha pontuação associada
WITH duplicates AS (
  SELECT lo.id,
    ROW_NUMBER() OVER (
      PARTITION BY lo.ordem_id, lo.item, lo.quantidade, COALESCE(lo.tamanho, '')
      ORDER BY lo.created_at DESC
    ) as rn,
    EXISTS (SELECT 1 FROM pontuacao_colaboradores pc WHERE pc.linha_id = lo.id) as has_pontuacao
  FROM linhas_ordens lo
  WHERE lo.pedido_linha_id IS NULL
)
DELETE FROM linhas_ordens
WHERE id IN (
  SELECT id FROM duplicates 
  WHERE rn > 1 
  AND has_pontuacao = false  -- Só deletar se NÃO tiver pontuação
);

-- 4. ATUALIZAR FUNÇÃO: Adicionar verificação por combinação de campos além do pedido_linha_id
CREATE OR REPLACE FUNCTION public.criar_ordens_producao_automaticas(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido RECORD;
  v_ordem_perfiladeira_id uuid;
  v_ordem_separacao_id uuid;
  v_ordem_soldagem_id uuid;
  pl RECORD;
  v_item_nome text;
BEGIN
  -- Buscar dados do pedido
  SELECT * INTO v_pedido FROM pedidos_producao WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_pedido_id;
  END IF;

  -- Criar ou buscar ordem de perfiladeira
  SELECT id INTO v_ordem_perfiladeira_id 
  FROM ordens_perfiladeira 
  WHERE pedido_id = p_pedido_id 
  LIMIT 1;
  
  IF v_ordem_perfiladeira_id IS NULL THEN
    INSERT INTO ordens_perfiladeira (pedido_id, status, created_at)
    VALUES (p_pedido_id, 'pendente', now())
    RETURNING id INTO v_ordem_perfiladeira_id;
  END IF;

  -- Criar ou buscar ordem de separação
  SELECT id INTO v_ordem_separacao_id 
  FROM ordens_separacao 
  WHERE pedido_id = p_pedido_id 
  LIMIT 1;
  
  IF v_ordem_separacao_id IS NULL THEN
    INSERT INTO ordens_separacao (pedido_id, status, created_at)
    VALUES (p_pedido_id, 'pendente', now())
    RETURNING id INTO v_ordem_separacao_id;
  END IF;

  -- Criar ou buscar ordem de soldagem
  SELECT id INTO v_ordem_soldagem_id 
  FROM ordens_soldagem 
  WHERE pedido_id = p_pedido_id 
  LIMIT 1;
  
  IF v_ordem_soldagem_id IS NULL THEN
    INSERT INTO ordens_soldagem (pedido_id, status, created_at)
    VALUES (p_pedido_id, 'pendente', now())
    RETURNING id INTO v_ordem_soldagem_id;
  END IF;

  -- Processar linhas do pedido e criar linhas nas ordens
  FOR pl IN 
    SELECT * FROM pedido_linhas WHERE pedido_id = p_pedido_id
  LOOP
    v_item_nome := COALESCE(pl.nome_produto, pl.descricao_produto, 'Item');
    
    -- Criar linha na ordem correspondente baseado na categoria
    -- Verificar por pedido_linha_id E por combinação de campos (para evitar duplicatas legadas)
    IF pl.categoria = 'perfiladeira' THEN
      IF NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE (lo.pedido_linha_id = pl.id)
           OR (lo.ordem_id = v_ordem_perfiladeira_id 
               AND lo.item = v_item_nome
               AND lo.quantidade = COALESCE(pl.quantidade, 1)
               AND COALESCE(lo.tamanho, '') = COALESCE(pl.tamanho, ''))
      ) THEN
        INSERT INTO linhas_ordens (ordem_id, ordem_tipo, item, quantidade, tamanho, pedido_linha_id, created_at)
        VALUES (v_ordem_perfiladeira_id, 'perfiladeira', v_item_nome, COALESCE(pl.quantidade, 1), pl.tamanho, pl.id, now());
      END IF;
      
    ELSIF pl.categoria = 'separacao' THEN
      IF NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE (lo.pedido_linha_id = pl.id)
           OR (lo.ordem_id = v_ordem_separacao_id 
               AND lo.item = v_item_nome
               AND lo.quantidade = COALESCE(pl.quantidade, 1)
               AND COALESCE(lo.tamanho, '') = COALESCE(pl.tamanho, ''))
      ) THEN
        INSERT INTO linhas_ordens (ordem_id, ordem_tipo, item, quantidade, tamanho, pedido_linha_id, created_at)
        VALUES (v_ordem_separacao_id, 'separacao', v_item_nome, COALESCE(pl.quantidade, 1), pl.tamanho, pl.id, now());
      END IF;
      
    ELSIF pl.categoria = 'solda' THEN
      IF NOT EXISTS (
        SELECT 1 FROM linhas_ordens lo 
        WHERE (lo.pedido_linha_id = pl.id)
           OR (lo.ordem_id = v_ordem_soldagem_id 
               AND lo.item = v_item_nome
               AND lo.quantidade = COALESCE(pl.quantidade, 1)
               AND COALESCE(lo.tamanho, '') = COALESCE(pl.tamanho, ''))
      ) THEN
        INSERT INTO linhas_ordens (ordem_id, ordem_tipo, item, quantidade, tamanho, pedido_linha_id, created_at)
        VALUES (v_ordem_soldagem_id, 'soldagem', v_item_nome, COALESCE(pl.quantidade, 1), pl.tamanho, pl.id, now());
      END IF;
    END IF;
  END LOOP;
END;
$$;