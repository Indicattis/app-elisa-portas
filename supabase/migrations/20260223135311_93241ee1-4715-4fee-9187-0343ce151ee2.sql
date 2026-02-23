CREATE OR REPLACE FUNCTION public.delete_contas_receber_on_venda_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM contas_receber WHERE venda_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_delete_contas_on_venda_delete
BEFORE DELETE ON vendas
FOR EACH ROW
EXECUTE FUNCTION public.delete_contas_receber_on_venda_delete();