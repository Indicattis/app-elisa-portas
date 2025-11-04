-- Rename licenciado to franqueado in tipo_parceiro enum
ALTER TYPE tipo_parceiro RENAME VALUE 'licenciado' TO 'franqueado';

-- Rename licenciado_etapa enum to franqueado_etapa
ALTER TYPE licenciado_etapa RENAME TO franqueado_etapa;

-- Rename the column in autorizados table
ALTER TABLE autorizados RENAME COLUMN licenciado_etapa TO franqueado_etapa;