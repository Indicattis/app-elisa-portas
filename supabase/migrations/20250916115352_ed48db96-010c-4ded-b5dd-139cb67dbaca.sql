-- Adicionar coluna para controlar o início da contagem de inativação
ALTER TABLE public.autorizados 
ADD COLUMN data_inicio_contagem_inativacao TIMESTAMP WITH TIME ZONE;

-- Definir a data atual como início da contagem para todos os autorizados ativos
UPDATE public.autorizados 
SET data_inicio_contagem_inativacao = now() 
WHERE ativo = true;

-- Garantir que novos autorizados tenham essa data definida automaticamente
ALTER TABLE public.autorizados 
ALTER COLUMN data_inicio_contagem_inativacao SET DEFAULT now();

-- Criar função para resetar a contagem quando houver nova avaliação
CREATE OR REPLACE FUNCTION public.resetar_contagem_inativacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Resetar a data de início da contagem quando uma nova avaliação for criada
  UPDATE public.autorizados 
  SET data_inicio_contagem_inativacao = now()
  WHERE id = NEW.autorizado_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para resetar automaticamente a contagem quando houver nova avaliação
CREATE TRIGGER trigger_resetar_contagem_inativacao
  AFTER INSERT ON public.autorizados_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.resetar_contagem_inativacao();