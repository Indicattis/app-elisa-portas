-- Adicionar ON DELETE CASCADE nas FKs que referenciam pedidos_producao

-- ordens_carregamento
ALTER TABLE ordens_carregamento 
DROP CONSTRAINT IF EXISTS ordens_carregamento_pedido_id_fkey;

ALTER TABLE ordens_carregamento
ADD CONSTRAINT ordens_carregamento_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- instalacoes
ALTER TABLE instalacoes 
DROP CONSTRAINT IF EXISTS instalacoes_pedido_id_fkey;

ALTER TABLE instalacoes 
DROP CONSTRAINT IF EXISTS instalacoes_pedido_id_fkey1;

ALTER TABLE instalacoes
ADD CONSTRAINT instalacoes_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- entregas
ALTER TABLE entregas 
DROP CONSTRAINT IF EXISTS entregas_pedido_id_fkey;

ALTER TABLE entregas
ADD CONSTRAINT entregas_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- linhas_ordens
ALTER TABLE linhas_ordens 
DROP CONSTRAINT IF EXISTS linhas_ordens_pedido_id_fkey;

ALTER TABLE linhas_ordens
ADD CONSTRAINT linhas_ordens_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- pedido_linhas
ALTER TABLE pedido_linhas 
DROP CONSTRAINT IF EXISTS pedido_linhas_pedido_id_fkey;

ALTER TABLE pedido_linhas
ADD CONSTRAINT pedido_linhas_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- pedidos_etapas
ALTER TABLE pedidos_etapas 
DROP CONSTRAINT IF EXISTS pedidos_etapas_pedido_id_fkey;

ALTER TABLE pedidos_etapas
ADD CONSTRAINT pedidos_etapas_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- pedidos_movimentacoes
ALTER TABLE pedidos_movimentacoes 
DROP CONSTRAINT IF EXISTS pedidos_movimentacoes_pedido_id_fkey;

ALTER TABLE pedidos_movimentacoes
ADD CONSTRAINT pedidos_movimentacoes_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- ordens_soldagem
ALTER TABLE ordens_soldagem 
DROP CONSTRAINT IF EXISTS ordens_soldagem_pedido_id_fkey;

ALTER TABLE ordens_soldagem
ADD CONSTRAINT ordens_soldagem_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- ordens_perfiladeira
ALTER TABLE ordens_perfiladeira 
DROP CONSTRAINT IF EXISTS ordens_perfiladeira_pedido_id_fkey;

ALTER TABLE ordens_perfiladeira
ADD CONSTRAINT ordens_perfiladeira_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- ordens_separacao
ALTER TABLE ordens_separacao 
DROP CONSTRAINT IF EXISTS ordens_separacao_pedido_id_fkey;

ALTER TABLE ordens_separacao
ADD CONSTRAINT ordens_separacao_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- ordens_qualidade
ALTER TABLE ordens_qualidade 
DROP CONSTRAINT IF EXISTS ordens_qualidade_pedido_id_fkey;

ALTER TABLE ordens_qualidade
ADD CONSTRAINT ordens_qualidade_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- ordens_pintura
ALTER TABLE ordens_pintura 
DROP CONSTRAINT IF EXISTS ordens_pintura_pedido_id_fkey;

ALTER TABLE ordens_pintura
ADD CONSTRAINT ordens_pintura_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;

-- ordens_instalacao
ALTER TABLE ordens_instalacao 
DROP CONSTRAINT IF EXISTS ordens_instalacao_pedido_id_fkey;

ALTER TABLE ordens_instalacao
ADD CONSTRAINT ordens_instalacao_pedido_id_fkey 
FOREIGN KEY (pedido_id) REFERENCES pedidos_producao(id) ON DELETE CASCADE;