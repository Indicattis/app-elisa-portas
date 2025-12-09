-- Adicionar colunas de cálculo automático e item padrão de porta de enrolar
ALTER TABLE estoque
ADD COLUMN IF NOT EXISTS modulo_calculo text CHECK (modulo_calculo IN ('acrescimo', 'desconto')),
ADD COLUMN IF NOT EXISTS valor_calculo numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS eixo_calculo text CHECK (eixo_calculo IN ('largura', 'altura')),
ADD COLUMN IF NOT EXISTS item_padrao_porta_enrolar boolean DEFAULT false;