-- Create enum type for autorizado etapas
CREATE TYPE autorizado_etapa AS ENUM (
  'integracao',
  'treinamento_comercial', 
  'treinamento_ficha_tecnica',
  'treinamento_instalacao',
  'apto'
);

-- Add etapa column to autorizados table
ALTER TABLE public.autorizados 
ADD COLUMN etapa autorizado_etapa NOT NULL DEFAULT 'integracao';