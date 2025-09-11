-- Enable real-time for equipes_instalacao table
ALTER TABLE public.equipes_instalacao REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.equipes_instalacao;

-- Enable real-time for pontos_instalacao table  
ALTER TABLE public.pontos_instalacao REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.pontos_instalacao;