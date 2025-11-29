-- Corrigir interface das rotas financeiras para 'dashboard'
UPDATE app_routes
SET interface = 'dashboard'
WHERE key IN (
  'financeiro_faturamento',
  'financeiro_dre', 
  'financeiro_despesas',
  'financeiro_caixa',
  'notas_fiscais'
);