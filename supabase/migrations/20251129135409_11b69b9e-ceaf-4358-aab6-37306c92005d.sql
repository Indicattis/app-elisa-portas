-- Remover rotas financeiras duplicadas (antigas sem prefixo financeiro_)
DELETE FROM app_routes
WHERE key IN ('faturamento', 'dre', 'despesas')
  AND parent_key = 'financeiro_home';