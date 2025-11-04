-- Remove function with CASCADE to also drop the dependent trigger
DROP FUNCTION IF EXISTS public.criar_instalacao_automatica() CASCADE;