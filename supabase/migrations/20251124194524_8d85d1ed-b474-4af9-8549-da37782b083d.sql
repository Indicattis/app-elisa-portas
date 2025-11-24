-- Add data_producao column to pedidos_producao table
ALTER TABLE pedidos_producao 
ADD COLUMN IF NOT EXISTS data_producao date;