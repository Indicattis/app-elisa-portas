
-- Corrigir lucro_item de instalações migradas para exatamente 40% do valor_total_sem_frete
-- e compensar a diferença no produto-porta da mesma venda para preservar o lucro total

DO $$
DECLARE
  r RECORD;
  novo_lucro NUMERIC;
  diff NUMERIC;
  porta_id UUID;
BEGIN
  -- Identificar instalações originadas da migration (criadas em 2026-04-24, dia da migration)
  -- e que precisam de ajuste
  FOR r IN
    SELECT pv.id, pv.venda_id, pv.valor_total_sem_frete, pv.lucro_item
    FROM produtos_vendas pv
    WHERE pv.tipo_produto = 'instalacao'
      AND pv.created_at::date = '2026-04-24'
      AND ABS(pv.lucro_item - pv.valor_total_sem_frete * 0.40) > 0.01
  LOOP
    novo_lucro := ROUND((r.valor_total_sem_frete * 0.40)::numeric, 2);
    diff := novo_lucro - COALESCE(r.lucro_item, 0);

    -- Atualizar instalação
    UPDATE produtos_vendas
    SET lucro_item = novo_lucro
    WHERE id = r.id;

    -- Encontrar uma porta da mesma venda para compensar (preservar lucro total)
    SELECT id INTO porta_id
    FROM produtos_vendas
    WHERE venda_id = r.venda_id
      AND tipo_produto IN ('porta_enrolar', 'porta_social')
    ORDER BY valor_total_sem_frete DESC
    LIMIT 1;

    IF porta_id IS NOT NULL THEN
      UPDATE produtos_vendas
      SET lucro_item = COALESCE(lucro_item, 0) - diff
      WHERE id = porta_id;
    END IF;
  END LOOP;
END $$;
