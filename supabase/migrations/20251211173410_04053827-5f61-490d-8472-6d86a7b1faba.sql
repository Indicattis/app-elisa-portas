-- Adicionar coluna tipo_responsavel para distinguir entre admin e autorizado
ALTER TABLE pedido_porta_observacoes 
ADD COLUMN tipo_responsavel TEXT DEFAULT 'admin' 
CHECK (tipo_responsavel IN ('admin', 'autorizado'));