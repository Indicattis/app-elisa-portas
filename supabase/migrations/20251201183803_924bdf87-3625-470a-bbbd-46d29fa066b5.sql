-- Remover constraint antigo
ALTER TABLE notas_fiscais DROP CONSTRAINT IF EXISTS notas_fiscais_status_check;

-- Adicionar constraint com todos os status possíveis
ALTER TABLE notas_fiscais ADD CONSTRAINT notas_fiscais_status_check 
CHECK (status IN ('emitida', 'pendente', 'cancelada', 'processando', 'autorizada', 'rejeitada'));