-- Adicionar coluna aparencia_testeira na tabela pedido_porta_observacoes
ALTER TABLE pedido_porta_observacoes 
ADD COLUMN IF NOT EXISTS aparencia_testeira TEXT DEFAULT 'fora_do_vao' 
CHECK (aparencia_testeira IN ('fora_do_vao', 'dentro_do_vao'));