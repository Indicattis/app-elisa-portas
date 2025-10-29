-- Atualizar constraint da tabela tarefas para permitir valores para diferentes tipos de recorrência
-- 0 = todos os dias
-- 1-31 = dia específico do mês
-- -7, -15, -30 = intervalos em dias

ALTER TABLE public.tarefas 
DROP CONSTRAINT IF EXISTS tarefas_dia_recorrencia_check;

ALTER TABLE public.tarefas
ADD CONSTRAINT tarefas_dia_recorrencia_check 
CHECK (
  dia_recorrencia IS NULL OR 
  dia_recorrencia = 0 OR 
  (dia_recorrencia >= 1 AND dia_recorrencia <= 31) OR
  dia_recorrencia IN (-7, -15, -30)
);