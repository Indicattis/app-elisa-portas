-- Tornar bucket de contratos de vendas público para permitir acesso via URL pública
UPDATE storage.buckets
SET public = true
WHERE id = 'contratos-vendas';