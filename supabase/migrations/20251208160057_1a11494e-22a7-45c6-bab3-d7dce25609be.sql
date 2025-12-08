-- Adicionar campos de próxima troca de óleo na tabela veiculos
ALTER TABLE public.veiculos 
ADD COLUMN km_proxima_troca_oleo numeric DEFAULT NULL,
ADD COLUMN data_proxima_troca_oleo date DEFAULT NULL;