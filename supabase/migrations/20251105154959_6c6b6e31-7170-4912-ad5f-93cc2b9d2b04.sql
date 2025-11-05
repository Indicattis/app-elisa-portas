-- Adicionar foreign key constraint para pintura_inicios.iniciado_por
ALTER TABLE public.pintura_inicios
ADD CONSTRAINT pintura_inicios_iniciado_por_fkey
FOREIGN KEY (iniciado_por)
REFERENCES auth.users(id)
ON DELETE CASCADE;