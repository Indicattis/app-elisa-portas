-- Step 1: Create new enum type
CREATE TYPE autorizado_etapa_new AS ENUM ('ativo', 'premium', 'perdido');

-- Step 2: Add a temporary column with the new type
ALTER TABLE autorizados ADD COLUMN etapa_new autorizado_etapa_new;

-- Step 3: Migrate data to new column
UPDATE autorizados 
SET etapa_new = CASE 
  WHEN etapa::text = 'premium' THEN 'premium'::autorizado_etapa_new
  ELSE 'ativo'::autorizado_etapa_new
END;

-- Step 4: Drop old column and rename new one
ALTER TABLE autorizados DROP COLUMN etapa;
ALTER TABLE autorizados RENAME COLUMN etapa_new TO etapa;

-- Step 5: Set default value
ALTER TABLE autorizados ALTER COLUMN etapa SET DEFAULT 'ativo'::autorizado_etapa_new;

-- Step 6: Drop old enum and rename new one
DROP TYPE IF EXISTS autorizado_etapa CASCADE;
ALTER TYPE autorizado_etapa_new RENAME TO autorizado_etapa;

-- Step 7: Add contract columns
ALTER TABLE autorizados 
ADD COLUMN IF NOT EXISTS contrato_url text,
ADD COLUMN IF NOT EXISTS contrato_nome_arquivo text,
ADD COLUMN IF NOT EXISTS contrato_tamanho_arquivo integer,
ADD COLUMN IF NOT EXISTS contrato_uploaded_at timestamp with time zone;

-- Step 8: Drop rating-related tables
DROP TABLE IF EXISTS autorizados_ratings CASCADE;
DROP TABLE IF EXISTS inativacoes_automaticas_log CASCADE;

-- Step 9: Remove unnecessary columns from autorizados
ALTER TABLE autorizados 
DROP COLUMN IF EXISTS data_inicio_contagem_inativacao,
DROP COLUMN IF EXISTS data_inativacao_automatica,
DROP COLUMN IF EXISTS inativado_automaticamente;

-- Step 10: Drop rating_categoria enum
DROP TYPE IF EXISTS rating_categoria CASCADE;

-- Step 11: Create storage bucket for contracts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contratos-autorizados', 'contratos-autorizados', false)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Create RLS policies for contracts bucket
CREATE POLICY "Authenticated users can view contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'contratos-autorizados' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contratos-autorizados' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contracts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'contratos-autorizados' AND auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete contracts"
ON storage.objects FOR DELETE
USING (bucket_id = 'contratos-autorizados' AND auth.uid() IN (
  SELECT user_id FROM admin_users WHERE role = 'administrador' AND ativo = true
));