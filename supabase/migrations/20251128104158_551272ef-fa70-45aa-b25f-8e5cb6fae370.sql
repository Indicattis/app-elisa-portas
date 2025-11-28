-- Remover rota duplicada de contratos da interface admin
UPDATE app_routes 
SET active = false 
WHERE key = 'vendas_contratos' AND interface = 'admin';