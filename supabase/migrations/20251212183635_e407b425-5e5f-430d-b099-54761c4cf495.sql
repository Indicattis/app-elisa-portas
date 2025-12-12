-- Adicionar campos de modalidade de pagamento
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS modalidade_pagamento TEXT DEFAULT 'mensal' CHECK (modalidade_pagamento IN ('mensal', 'diaria')),
ADD COLUMN IF NOT EXISTS em_folha BOOLEAN DEFAULT true;