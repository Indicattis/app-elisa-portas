-- Criar cron jobs para geocodificação automática do mapa
-- Executa às 06:00, 12:00 e 18:00 todos os dias

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para geocodificação às 06:00
SELECT cron.schedule(
  'geocode-autorizados-06h',
  '0 6 * * *', -- 06:00 todos os dias
  $$
  SELECT
    net.http_post(
        url:='https://zddnvwqhfcqspmxscwyy.supabase.co/functions/v1/batch-geocode-autorizados',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZG52d3FoZmNxc3BteHNjd3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjgyMzcsImV4cCI6MjA2NzE0NDIzN30.-DllUGMpirnjRGchwGsc3w2dna8SqSbq-_fKFvXKOfs"}'::jsonb,
        body:='{"scheduled": true, "time": "06:00"}'::jsonb
    ) as request_id;
  $$
);

-- Criar cron job para geocodificação às 12:00
SELECT cron.schedule(
  'geocode-autorizados-12h',
  '0 12 * * *', -- 12:00 todos os dias
  $$
  SELECT
    net.http_post(
        url:='https://zddnvwqhfcqspmxscwyy.supabase.co/functions/v1/batch-geocode-autorizados',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZG52d3FoZmNxc3BteHNjd3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjgyMzcsImV4cCI6MjA2NzE0NDIzN30.-DllUGMpirnjRGchwGsc3w2dna8SqSbq-_fKFvXKOfs"}'::jsonb,
        body:='{"scheduled": true, "time": "12:00"}'::jsonb
    ) as request_id;
  $$
);

-- Criar cron job para geocodificação às 18:00
SELECT cron.schedule(
  'geocode-autorizados-18h',
  '0 18 * * *', -- 18:00 todos os dias
  $$
  SELECT
    net.http_post(
        url:='https://zddnvwqhfcqspmxscwyy.supabase.co/functions/v1/batch-geocode-autorizados',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZG52d3FoZmNxc3BteHNjd3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjgyMzcsImV4cCI6MjA2NzE0NDIzN30.-DllUGMpirnjRGchwGsc3w2dna8SqSbq-_fKFvXKOfs"}'::jsonb,
        body:='{"scheduled": true, "time": "18:00"}'::jsonb
    ) as request_id;
  $$
);