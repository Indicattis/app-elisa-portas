-- Atualizar hrefs dos Checklist Liderança para incluir parâmetro de setor
UPDATE public.app_tabs 
SET href = '/dashboard/checklist-lideranca?setor=vendas'
WHERE key = 'checklist_lideranca_vendas_group';

UPDATE public.app_tabs 
SET href = '/dashboard/checklist-lideranca?setor=marketing'
WHERE key = 'checklist_lideranca_marketing_group';

UPDATE public.app_tabs 
SET href = '/dashboard/checklist-lideranca?setor=instalacoes'
WHERE key = 'checklist_lideranca_instalacoes_group';

UPDATE public.app_tabs 
SET href = '/dashboard/checklist-lideranca?setor=fabrica'
WHERE key = 'checklist_lideranca_fabrica';

UPDATE public.app_tabs 
SET href = '/dashboard/checklist-lideranca?setor=administrativo'
WHERE key = 'checklist_lideranca_administrativo';