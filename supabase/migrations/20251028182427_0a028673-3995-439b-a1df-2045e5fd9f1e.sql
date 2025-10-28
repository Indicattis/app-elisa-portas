-- Mover Diário de Bordo para o grupo Administrativo
UPDATE public.app_tabs
SET parent_key = 'administrativo',
    sort_order = 5,
    updated_at = now()
WHERE key = 'diario_bordo';