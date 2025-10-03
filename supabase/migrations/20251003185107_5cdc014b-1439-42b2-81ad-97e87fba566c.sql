-- Adicionar cor "Aço galvanizado" ao catálogo de cores
INSERT INTO public.catalogo_cores (nome, codigo_hex, ativa)
VALUES ('Aço galvanizado', '#B8B8B8', true)
ON CONFLICT DO NOTHING;