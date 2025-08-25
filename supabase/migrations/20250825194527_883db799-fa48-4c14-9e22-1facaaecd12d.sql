-- Add latitude/longitude cache columns for Autorizados
ALTER TABLE public.autorizados
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS last_geocoded_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS geocode_precision text;

-- Optional: index for lat/lng
CREATE INDEX IF NOT EXISTS idx_autorizados_lat_lon
  ON public.autorizados (latitude, longitude);