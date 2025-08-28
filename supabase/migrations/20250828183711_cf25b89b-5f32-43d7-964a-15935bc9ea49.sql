-- Enable realtime for the tables we need to monitor
ALTER TABLE public.contador_vendas_dias REPLICA IDENTITY FULL;
ALTER TABLE public.admin_users REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contador_vendas_dias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;