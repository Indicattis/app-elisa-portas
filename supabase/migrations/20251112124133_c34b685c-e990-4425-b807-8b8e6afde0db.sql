-- Add data_referencia column to tarefas table to track which date recurring tasks were created for
ALTER TABLE tarefas
ADD COLUMN IF NOT EXISTS data_referencia DATE;

-- Add index for faster queries when checking if task already exists for a date
CREATE INDEX IF NOT EXISTS idx_tarefas_template_data_referencia 
ON tarefas(template_id, data_referencia) 
WHERE template_id IS NOT NULL;