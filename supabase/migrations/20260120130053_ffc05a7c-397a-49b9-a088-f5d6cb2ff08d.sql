-- 1. Deletar linhas duplicadas antigas (sem pedido_linha_id) do pedido específico
DELETE FROM linhas_ordens
WHERE pedido_id = 'b157f1fe-bbfc-4c18-86fa-f687bf2ef5b8'
  AND tipo_ordem = 'perfiladeira'
  AND pedido_linha_id IS NULL;

-- 2. Corrigir TODAS as linhas órfãs de perfiladeira (ordem_id aponta para ordem inexistente)
UPDATE linhas_ordens lo
SET ordem_id = (
  SELECT op.id FROM ordens_perfiladeira op 
  WHERE op.pedido_id = lo.pedido_id
  ORDER BY op.created_at DESC
  LIMIT 1
)
WHERE lo.tipo_ordem = 'perfiladeira'
  AND NOT EXISTS (
    SELECT 1 FROM ordens_perfiladeira op WHERE op.id = lo.ordem_id
  )
  AND EXISTS (
    SELECT 1 FROM ordens_perfiladeira op WHERE op.pedido_id = lo.pedido_id
  );

-- 3. Corrigir linhas órfãs de soldagem
UPDATE linhas_ordens lo
SET ordem_id = (
  SELECT os.id FROM ordens_soldagem os 
  WHERE os.pedido_id = lo.pedido_id
  ORDER BY os.created_at DESC
  LIMIT 1
)
WHERE lo.tipo_ordem = 'soldagem'
  AND NOT EXISTS (
    SELECT 1 FROM ordens_soldagem os WHERE os.id = lo.ordem_id
  )
  AND EXISTS (
    SELECT 1 FROM ordens_soldagem os WHERE os.pedido_id = lo.pedido_id
  );

-- 4. Corrigir linhas órfãs de separação
UPDATE linhas_ordens lo
SET ordem_id = (
  SELECT osp.id FROM ordens_separacao osp 
  WHERE osp.pedido_id = lo.pedido_id
  ORDER BY osp.created_at DESC
  LIMIT 1
)
WHERE lo.tipo_ordem = 'separacao'
  AND NOT EXISTS (
    SELECT 1 FROM ordens_separacao osp WHERE osp.id = lo.ordem_id
  )
  AND EXISTS (
    SELECT 1 FROM ordens_separacao osp WHERE osp.pedido_id = lo.pedido_id
  );