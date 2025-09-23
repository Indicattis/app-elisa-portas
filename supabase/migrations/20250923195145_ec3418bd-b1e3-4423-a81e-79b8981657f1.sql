-- Ocultar links específicos da sidebar conforme solicitado
UPDATE app_tabs 
SET active = false 
WHERE key IN (
  'leads',
  'pedidos', 
  'visitas',
  'producao',
  'instalacoes', 
  'faturamento',
  'marketing',
  'contas_receber',
  'calendario',
  'configuracoes'
) AND tab_group = 'sidebar';