-- Recriar trigger com abordagem diferente
DROP TRIGGER IF EXISTS criar_logistica_ao_avancar_trigger ON public.pedidos_producao;

CREATE TRIGGER criar_logistica_ao_avancar_trigger
  AFTER UPDATE ON public.pedidos_producao
  FOR EACH ROW
  WHEN (NEW.etapa_atual = 'em_producao' AND (OLD.etapa_atual IS NULL OR OLD.etapa_atual = 'aberto'))
  EXECUTE FUNCTION public.criar_logistica_ao_avancar_producao();