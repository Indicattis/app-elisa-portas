-- Atualizar sort_order do Checklist Liderança para aparecer primeiro em cada grupo
UPDATE public.app_tabs
SET sort_order = 0
WHERE key LIKE 'checklist_lideranca_%'
  AND parent_key IS NOT NULL;