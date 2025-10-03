-- Remover foreign key anterior se existir
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS fk_vendas_atendente;
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_atendente_id_fkey;

-- Garantir que user_id em admin_users seja único
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_unique UNIQUE (user_id);

-- Corrigir atendente_id na tabela vendas
UPDATE public.vendas SET atendente_id = 'a5a1721d-a710-43a6-82c0-60d5501ff47b'
WHERE atendente_id = 'cff6be68-3bc3-4d62-98e4-8eb9101415c6';

UPDATE public.vendas SET atendente_id = 'aba79b0e-a033-4898-8f71-5aa03641d1fa'
WHERE atendente_id = '4ac05c4c-8da0-4316-98ef-48dc3fd0f55b';

UPDATE public.vendas SET atendente_id = '8167a493-f11a-4880-9677-af9bc41183a9'
WHERE atendente_id = 'ebc6e02d-e7b4-4b5b-a07f-f64af5f8ebe2';

UPDATE public.vendas SET atendente_id = 'b8cc19ec-f925-45c1-9cdf-5064bb3d7fa2'
WHERE atendente_id = 'cd9988da-9253-44e8-a32e-7c476f101609';

UPDATE public.vendas SET atendente_id = 'deabe732-b97e-4a3e-8f03-47209fa205f9'
WHERE atendente_id = 'a47eb47d-787e-4635-8987-b95e515bb0fa';

UPDATE public.vendas SET atendente_id = '3fe9933c-6d25-49d0-8f5a-4ff369d6e43b'
WHERE atendente_id = '1e7f9f9f-6a34-43b5-9a78-86ca0f72b29e';

UPDATE public.vendas SET atendente_id = 'e529664c-ac01-4da0-bea5-fe5a7496c35f'
WHERE atendente_id = '121d4ef1-bb37-4b95-b24c-b94a1a2cacb7';

UPDATE public.vendas SET atendente_id = '68caa17c-5585-45b2-99c2-140fff8621fe'
WHERE atendente_id = '2e2efc81-1b71-47d7-81e9-b9c8a737fee4';

-- Adicionar foreign key para garantir integridade futura
ALTER TABLE public.vendas 
ADD CONSTRAINT fk_vendas_atendente 
FOREIGN KEY (atendente_id) 
REFERENCES public.admin_users(user_id) 
ON DELETE SET NULL;