-- Step 1: Clean up orphaned records before adding CASCADE constraints

-- Clean linhas_ordens orphaned records
DELETE FROM linhas_ordens 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = linhas_ordens.pedido_id
);

-- Clean ordens_soldagem orphaned records
DELETE FROM ordens_soldagem 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = ordens_soldagem.pedido_id
);

-- Clean ordens_perfiladeira orphaned records
DELETE FROM ordens_perfiladeira 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = ordens_perfiladeira.pedido_id
);

-- Clean ordens_separacao orphaned records
DELETE FROM ordens_separacao 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = ordens_separacao.pedido_id
);

-- Clean ordens_pintura orphaned records
DELETE FROM ordens_pintura 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = ordens_pintura.pedido_id
);

-- Clean ordens_qualidade orphaned records
DELETE FROM ordens_qualidade 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = ordens_qualidade.pedido_id
);

-- Clean ordens_instalacao orphaned records
DELETE FROM ordens_instalacao 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = ordens_instalacao.pedido_id
);

-- Clean instalacoes_cadastradas orphaned records
DELETE FROM instalacoes_cadastradas 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = instalacoes_cadastradas.pedido_id
);

-- Clean entregas orphaned records
DELETE FROM entregas 
WHERE pedido_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM pedidos_producao 
  WHERE pedidos_producao.id = entregas.pedido_id
);

-- Step 2: Now add CASCADE constraints

-- ordens_soldagem
ALTER TABLE ordens_soldagem 
DROP CONSTRAINT IF EXISTS ordens_soldagem_pedido_id_fkey;

ALTER TABLE ordens_soldagem 
ADD CONSTRAINT ordens_soldagem_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- ordens_perfiladeira
ALTER TABLE ordens_perfiladeira 
DROP CONSTRAINT IF EXISTS ordens_perfiladeira_pedido_id_fkey;

ALTER TABLE ordens_perfiladeira 
ADD CONSTRAINT ordens_perfiladeira_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- ordens_separacao
ALTER TABLE ordens_separacao 
DROP CONSTRAINT IF EXISTS ordens_separacao_pedido_id_fkey;

ALTER TABLE ordens_separacao 
ADD CONSTRAINT ordens_separacao_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- ordens_pintura
ALTER TABLE ordens_pintura 
DROP CONSTRAINT IF EXISTS ordens_pintura_pedido_id_fkey;

ALTER TABLE ordens_pintura 
ADD CONSTRAINT ordens_pintura_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- ordens_qualidade
ALTER TABLE ordens_qualidade 
DROP CONSTRAINT IF EXISTS ordens_qualidade_pedido_id_fkey;

ALTER TABLE ordens_qualidade 
ADD CONSTRAINT ordens_qualidade_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- ordens_instalacao
ALTER TABLE ordens_instalacao 
DROP CONSTRAINT IF EXISTS ordens_instalacao_pedido_id_fkey;

ALTER TABLE ordens_instalacao 
ADD CONSTRAINT ordens_instalacao_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- instalacoes_cadastradas
ALTER TABLE instalacoes_cadastradas 
DROP CONSTRAINT IF EXISTS instalacoes_cadastradas_pedido_id_fkey;

ALTER TABLE instalacoes_cadastradas 
ADD CONSTRAINT instalacoes_cadastradas_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- entregas
ALTER TABLE entregas 
DROP CONSTRAINT IF EXISTS entregas_pedido_id_fkey;

ALTER TABLE entregas 
ADD CONSTRAINT entregas_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;

-- linhas_ordens
ALTER TABLE linhas_ordens 
DROP CONSTRAINT IF EXISTS linhas_ordens_pedido_id_fkey;

ALTER TABLE linhas_ordens 
ADD CONSTRAINT linhas_ordens_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) 
ON DELETE CASCADE;