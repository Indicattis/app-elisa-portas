-- Criar o novo enum type
CREATE TYPE autorizado_etapa_new AS ENUM (
  'apresentacao_proposta',
  'treinamentos_video', 
  'apto'
);

-- Adicionar coluna temporária com o novo enum
ALTER TABLE autorizados ADD COLUMN etapa_new autorizado_etapa_new;

-- Converter valores existentes para o novo enum
UPDATE autorizados SET etapa_new = 
  CASE etapa::text
    WHEN 'apresentacao_proposta' THEN 'apresentacao_proposta'::autorizado_etapa_new
    WHEN 'treinamento_ficha_tecnica' THEN 'treinamentos_video'::autorizado_etapa_new
    WHEN 'treinamento_instalacao' THEN 'treinamentos_video'::autorizado_etapa_new
    WHEN 'apto' THEN 'apto'::autorizado_etapa_new
    ELSE 'apresentacao_proposta'::autorizado_etapa_new
  END;

-- Remover coluna antiga e renomear a nova
ALTER TABLE autorizados DROP COLUMN etapa;
ALTER TABLE autorizados RENAME COLUMN etapa_new TO etapa;

-- Definir default para a coluna
ALTER TABLE autorizados ALTER COLUMN etapa SET DEFAULT 'apresentacao_proposta'::autorizado_etapa_new;

-- Remover enum antigo e renomear o novo
DROP TYPE autorizado_etapa;
ALTER TYPE autorizado_etapa_new RENAME TO autorizado_etapa;