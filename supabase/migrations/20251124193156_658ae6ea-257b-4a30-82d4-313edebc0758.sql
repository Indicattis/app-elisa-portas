-- Permitir que data_instalacao seja NULL
ALTER TABLE instalacoes ALTER COLUMN data_instalacao DROP NOT NULL;