
-- Adicionar coluna vezes_agendado nas 4 tabelas
ALTER TABLE public.ordens_carregamento ADD COLUMN IF NOT EXISTS vezes_agendado integer NOT NULL DEFAULT 0;
ALTER TABLE public.instalacoes ADD COLUMN IF NOT EXISTS vezes_agendado integer NOT NULL DEFAULT 0;
ALTER TABLE public.neo_instalacoes ADD COLUMN IF NOT EXISTS vezes_agendado integer NOT NULL DEFAULT 0;
ALTER TABLE public.neo_correcoes ADD COLUMN IF NOT EXISTS vezes_agendado integer NOT NULL DEFAULT 0;

-- Trigger para ordens_carregamento (monitora data_carregamento)
CREATE OR REPLACE FUNCTION public.incrementar_vezes_agendado_ordem_carregamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_carregamento IS NOT NULL AND (OLD.data_carregamento IS NULL OR NEW.data_carregamento IS DISTINCT FROM OLD.data_carregamento) THEN
    NEW.vezes_agendado := COALESCE(OLD.vezes_agendado, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_incrementar_vezes_agendado ON public.ordens_carregamento;
CREATE TRIGGER trg_incrementar_vezes_agendado
BEFORE UPDATE ON public.ordens_carregamento
FOR EACH ROW
EXECUTE FUNCTION public.incrementar_vezes_agendado_ordem_carregamento();

-- Trigger para instalacoes (monitora data_carregamento)
CREATE OR REPLACE FUNCTION public.incrementar_vezes_agendado_instalacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_carregamento IS NOT NULL AND (OLD.data_carregamento IS NULL OR NEW.data_carregamento IS DISTINCT FROM OLD.data_carregamento) THEN
    NEW.vezes_agendado := COALESCE(OLD.vezes_agendado, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_incrementar_vezes_agendado ON public.instalacoes;
CREATE TRIGGER trg_incrementar_vezes_agendado
BEFORE UPDATE ON public.instalacoes
FOR EACH ROW
EXECUTE FUNCTION public.incrementar_vezes_agendado_instalacao();

-- Trigger para neo_instalacoes (monitora data_instalacao)
CREATE OR REPLACE FUNCTION public.incrementar_vezes_agendado_neo_instalacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_instalacao IS NOT NULL AND (OLD.data_instalacao IS NULL OR NEW.data_instalacao IS DISTINCT FROM OLD.data_instalacao) THEN
    NEW.vezes_agendado := COALESCE(OLD.vezes_agendado, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_incrementar_vezes_agendado ON public.neo_instalacoes;
CREATE TRIGGER trg_incrementar_vezes_agendado
BEFORE UPDATE ON public.neo_instalacoes
FOR EACH ROW
EXECUTE FUNCTION public.incrementar_vezes_agendado_neo_instalacao();

-- Trigger para neo_correcoes (monitora data_correcao)
CREATE OR REPLACE FUNCTION public.incrementar_vezes_agendado_neo_correcao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_correcao IS NOT NULL AND (OLD.data_correcao IS NULL OR NEW.data_correcao IS DISTINCT FROM OLD.data_correcao) THEN
    NEW.vezes_agendado := COALESCE(OLD.vezes_agendado, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_incrementar_vezes_agendado ON public.neo_correcoes;
CREATE TRIGGER trg_incrementar_vezes_agendado
BEFORE UPDATE ON public.neo_correcoes
FOR EACH ROW
EXECUTE FUNCTION public.incrementar_vezes_agendado_neo_correcao();
