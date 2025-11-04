-- Atualizar nomes e ordem das pastas principais da sidebar
-- 00 - Direção
UPDATE public.app_tabs 
SET label = '00 - Direção', sort_order = 0
WHERE parent_key IS NULL AND (key LIKE '%direc%' OR href LIKE '%direc%' OR label ILIKE '%direção%' OR label ILIKE '%direcao%');

-- 01 - Marketing
UPDATE public.app_tabs 
SET label = '01 - Marketing', sort_order = 1
WHERE parent_key IS NULL AND (key LIKE '%market%' OR href LIKE '%market%' OR label ILIKE '%marketing%');

-- 02 - Vendas
UPDATE public.app_tabs 
SET label = '02 - Vendas', sort_order = 2
WHERE parent_key IS NULL AND (key LIKE '%venda%' OR href LIKE '%venda%' OR label ILIKE '%vendas%');

-- 03 - Fábrica
UPDATE public.app_tabs 
SET label = '03 - Fábrica', sort_order = 3
WHERE parent_key IS NULL AND (key LIKE '%fabrica%' OR href LIKE '%fabrica%' OR label ILIKE '%fábrica%' OR label ILIKE '%fabrica%');

-- 04 - Instalações
UPDATE public.app_tabs 
SET label = '04 - Instalações', sort_order = 4
WHERE parent_key IS NULL AND (key LIKE '%instalac%' OR href LIKE '%instalac%' OR label ILIKE '%instalações%' OR label ILIKE '%instalacoes%');

-- 05 - Logística
UPDATE public.app_tabs 
SET label = '05 - Logística', sort_order = 5
WHERE parent_key IS NULL AND (key LIKE '%logist%' OR href LIKE '%logist%' OR label ILIKE '%logística%' OR label ILIKE '%logistica%');

-- 06 - Administrativo
UPDATE public.app_tabs 
SET label = '06 - Administrativo', sort_order = 6
WHERE parent_key IS NULL AND (key LIKE '%admin%' OR href LIKE '%admin%' OR label ILIKE '%administrativo%');

-- 07 - DP/RH
UPDATE public.app_tabs 
SET label = '07 - DP/RH', sort_order = 7
WHERE parent_key IS NULL AND (key = 'dp-rh' OR label ILIKE '%dp%' OR label ILIKE '%rh%');