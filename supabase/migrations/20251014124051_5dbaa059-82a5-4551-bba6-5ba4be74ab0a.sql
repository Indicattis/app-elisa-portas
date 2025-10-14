-- Criar tabela de veículos
CREATE TABLE IF NOT EXISTS public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  km_atual NUMERIC NOT NULL DEFAULT 0,
  data_troca_oleo DATE,
  status TEXT NOT NULL DEFAULT 'pronto' CHECK (status IN ('pronto', 'atencao', 'critico', 'mecanico', 'em_uso')),
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar tabela de conferências de veículos
CREATE TABLE IF NOT EXISTS public.veiculos_conferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  foto_url TEXT NOT NULL,
  km_atual NUMERIC NOT NULL,
  data_troca_oleo DATE,
  agua_conferida BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('pronto', 'atencao', 'critico', 'mecanico', 'em_uso')),
  conferido_por UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar bucket de storage para fotos dos veículos
INSERT INTO storage.buckets (id, name, public)
VALUES ('veiculos-fotos', 'veiculos-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS nas tabelas
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos_conferencias ENABLE ROW LEVEL SECURITY;

-- RLS Policies para veiculos
CREATE POLICY "Authenticated users can view veiculos"
ON public.veiculos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create veiculos"
ON public.veiculos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update veiculos"
ON public.veiculos FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete veiculos"
ON public.veiculos FOR DELETE
TO authenticated
USING (is_admin());

-- RLS Policies para veiculos_conferencias
CREATE POLICY "Authenticated users can view conferencias"
ON public.veiculos_conferencias FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create conferencias"
ON public.veiculos_conferencias FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = conferido_por);

-- RLS Policies para storage bucket veiculos-fotos
CREATE POLICY "Anyone can view vehicle photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'veiculos-fotos');

CREATE POLICY "Authenticated users can upload vehicle photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'veiculos-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vehicle photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'veiculos-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete vehicle photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'veiculos-fotos' AND auth.uid() IS NOT NULL);

-- Trigger para atualizar veículo após conferência
CREATE OR REPLACE FUNCTION public.atualizar_veiculo_apos_conferencia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.veiculos
  SET 
    km_atual = NEW.km_atual,
    data_troca_oleo = NEW.data_troca_oleo,
    status = NEW.status,
    updated_at = now()
  WHERE id = NEW.veiculo_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_atualizar_veiculo
AFTER INSERT ON public.veiculos_conferencias
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_veiculo_apos_conferencia();

-- Adicionar entrada na tabela app_tabs
INSERT INTO public.app_tabs (
  key, 
  label, 
  href, 
  icon, 
  parent_key, 
  permission, 
  sort_order, 
  active, 
  tab_group
) VALUES (
  'frota', 
  'Frota', 
  '/dashboard/instalacoes/frota', 
  'Truck', 
  'instalacoes_group', 
  'instalacoes', 
  3, 
  true, 
  'sidebar'
) ON CONFLICT (key) DO NOTHING;