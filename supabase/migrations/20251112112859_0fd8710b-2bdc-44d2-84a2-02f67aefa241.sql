-- Add dias_semana column to tarefas_templates for day-of-week based recurrence
ALTER TABLE tarefas_templates ADD COLUMN IF NOT EXISTS dias_semana integer[];

-- Add comment explaining the column
COMMENT ON COLUMN tarefas_templates.dias_semana IS 'Array of weekdays (0=Sunday, 1=Monday, ..., 6=Saturday) when task should be created';