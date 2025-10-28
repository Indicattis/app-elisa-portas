-- Move Faturamento para o grupo Administrativo
UPDATE public.app_tabs
SET parent_key = 'administrativo',
    sort_order = 3,
    updated_at = now()
WHERE key = 'faturamento';

-- Move Organograma para o grupo Administrativo
UPDATE public.app_tabs
SET parent_key = 'administrativo',
    sort_order = 4,
    updated_at = now()
WHERE key = 'organograma';

-- Desativar subitens do grupo Financeiro
UPDATE public.app_tabs
SET active = false,
    updated_at = now()
WHERE parent_key = 'financeiro';

-- Desativar o grupo Financeiro
UPDATE public.app_tabs
SET active = false,
    updated_at = now()
WHERE key = 'financeiro';

-- Desativar subitens do grupo RH
UPDATE public.app_tabs
SET active = false,
    updated_at = now()
WHERE parent_key = 'rh_group';

-- Desativar o grupo RH
UPDATE public.app_tabs
SET active = false,
    updated_at = now()
WHERE key = 'rh_group';