-- Garantir que as rotas financeiras da interface admin fiquem no grupo "administrativo"

UPDATE app_routes
SET "group" = 'administrativo'
WHERE key IN ('financeiro_caixa', 'financeiro_despesas', 'financeiro_dre', 'financeiro_faturamento')
  AND interface = 'admin';