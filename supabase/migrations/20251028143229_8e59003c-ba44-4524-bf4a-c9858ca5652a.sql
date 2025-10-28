-- Atualizar a ordem dos grupos principais da sidebar
-- Nova ordem: Marketing, Vendas, Fábrica, Instalação, Administrativo, Financeiro, Parceiros, RH

UPDATE public.app_tabs
SET sort_order = CASE key
  WHEN 'marketing' THEN 10
  WHEN 'vendas' THEN 20
  WHEN 'fabrica' THEN 30
  WHEN 'instalacoes' THEN 40
  WHEN 'administrativo' THEN 50
  WHEN 'financeiro' THEN 60
  WHEN 'parceiros' THEN 70
  WHEN 'rh' THEN 80
  ELSE sort_order
END
WHERE parent_key IS NULL
  AND key IN ('marketing', 'vendas', 'fabrica', 'instalacoes', 'administrativo', 'financeiro', 'parceiros', 'rh');