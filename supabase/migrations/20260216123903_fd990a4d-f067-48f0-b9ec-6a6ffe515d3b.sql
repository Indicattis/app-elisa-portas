ALTER TABLE pedidos_producao ADD COLUMN is_correcao boolean DEFAULT false;
ALTER TABLE pedidos_producao ADD COLUMN pedido_origem_id uuid REFERENCES pedidos_producao(id);