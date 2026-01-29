-- Adicionar colunas de pagamento na entrega à tabela instalacoes
ALTER TABLE instalacoes 
ADD COLUMN IF NOT EXISTS valor_pagamento_entrega NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS metodo_pagamento_entrega TEXT;