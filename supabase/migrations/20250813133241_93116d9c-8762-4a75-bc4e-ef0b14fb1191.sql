-- Adicionar colunas status e classe na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN status_orcamento integer DEFAULT 1 CHECK (status_orcamento >= 1 AND status_orcamento <= 5),
ADD COLUMN classe integer,
ADD COLUMN motivo_perda text,
ADD COLUMN justificativa_perda text;

-- Função para calcular classe baseada no valor
CREATE OR REPLACE FUNCTION public.calcular_classe_orcamento(valor_total numeric)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF valor_total <= 20000 THEN
    RETURN 1;
  ELSIF valor_total <= 50000 THEN
    RETURN 2;
  ELSIF valor_total <= 75000 THEN
    RETURN 3;
  ELSIF valor_total <= 100000 THEN
    RETURN 4;
  ELSE
    RETURN 4; -- Valores acima de 100k também ficam classe 4
  END IF;
END;
$$;

-- Trigger para atualizar classe automaticamente
CREATE OR REPLACE FUNCTION public.update_classe_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.classe = calcular_classe_orcamento(NEW.valor_total);
  RETURN NEW;
END;
$$;

-- Criar trigger
CREATE TRIGGER trigger_update_classe_orcamento
  BEFORE INSERT OR UPDATE OF valor_total ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_classe_orcamento();

-- Atualizar orçamentos existentes
UPDATE public.orcamentos 
SET classe = calcular_classe_orcamento(valor_total);

-- Criar enum para motivos de perda
CREATE TYPE public.motivo_perda_orcamento AS ENUM (
  'preco',
  'prazo', 
  'qualidade',
  'logistica',
  'atendimento',
  'produto'
);