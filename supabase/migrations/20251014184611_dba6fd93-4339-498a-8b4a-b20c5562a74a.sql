-- Add nivel_oleo_conferido column to veiculos_conferencias table
ALTER TABLE public.veiculos_conferencias
ADD COLUMN nivel_oleo_conferido boolean NOT NULL DEFAULT false;