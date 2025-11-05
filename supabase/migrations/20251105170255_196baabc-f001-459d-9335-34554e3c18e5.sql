-- Desativar todas as entradas de Checklist Liderança da sidebar
UPDATE app_tabs 
SET active = false 
WHERE key IN (
  'checklist_lideranca_vendas_group',
  'checklist_lideranca_marketing_group',
  'checklist_lideranca_instalacoes_group',
  'checklist_lideranca_fabrica',
  'checklist_lideranca_administrativo',
  'checklist-lideranca'
);