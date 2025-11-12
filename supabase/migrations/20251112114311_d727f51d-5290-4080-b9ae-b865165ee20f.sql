-- Add hora_criacao column to tarefas_templates
ALTER TABLE tarefas_templates ADD COLUMN IF NOT EXISTS hora_criacao time without time zone DEFAULT '00:00:00';