-- Adicionar coluna placa na tabela veiculos
ALTER TABLE public.veiculos 
ADD COLUMN placa TEXT;

-- Adicionar coluna observacoes na tabela veiculos_conferencias
ALTER TABLE public.veiculos_conferencias 
ADD COLUMN observacoes TEXT;

-- Atualizar o trigger para não atualizar o status (já que não vem mais do formulário)
CREATE OR REPLACE FUNCTION public.atualizar_veiculo_apos_conferencia()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.veiculos
  SET 
    km_atual = NEW.km_atual,
    data_troca_oleo = NEW.data_troca_oleo,
    updated_at = now()
  WHERE id = NEW.veiculo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;