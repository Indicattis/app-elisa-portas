-- Fix the Autorizados tab href to match the correct route
UPDATE public.app_tabs 
SET href = '/dashboard/autorizados'
WHERE key = 'autorizados';