-- Update existing records to use the new stage values
UPDATE autorizados SET etapa = 'apresentacao_proposta' WHERE etapa = 'integracao';
UPDATE autorizados SET etapa = 'apresentacao_proposta' WHERE etapa = 'treinamento_comercial';