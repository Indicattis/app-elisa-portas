CREATE OR REPLACE FUNCTION public.gerar_conta_pagar_acordo_autorizado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.aprovado_direcao = true AND (OLD.aprovado_direcao IS DISTINCT FROM true) THEN
    INSERT INTO public.contas_pagar (
      descricao, valor_parcela, data_vencimento, categoria, status,
      numero_parcela, total_parcelas, observacoes, created_by
    ) VALUES (
      'Acordo Autorizado - ' || NEW.cliente_nome || ' (' || NEW.cliente_cidade || '/' || NEW.cliente_estado || ')',
      NEW.valor_acordado,
      (NEW.data_acordo::date + interval '30 days')::date,
      'Autorizados',
      'Pendente',
      1, 1,
      'Gerado automaticamente pela aprovação do acordo ID: ' || NEW.id,
      NEW.aprovado_direcao_por
    );
  END IF;
  RETURN NEW;
END;
$$;