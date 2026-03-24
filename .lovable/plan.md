

## Plano: Corrigir erro de tipo na trigger de aprovação de acordos

### Problema raiz
A trigger `gerar_conta_pagar_acordo_autorizado` (migration `20260324110100`) calcula a data de vencimento com `::date::text`, convertendo o resultado para `text`. A coluna `data_vencimento` na tabela `contas_pagar` é do tipo `DATE`, causando o erro `42804`.

### Correção

**Migration SQL** — recriar a função removendo o cast para `text`:

```sql
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
```

Única mudança: linha do `data_vencimento` — de `::date::text` para `::date`.

Nenhuma alteração no frontend necessária.

