-- Habilitar realtime para a tabela linhas_ordens
ALTER TABLE public.linhas_ordens REPLICA IDENTITY FULL;

-- Adicionar à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.linhas_ordens;