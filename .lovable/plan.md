

## Plano: Mover Contas a Pagar para FinanceiroHub + Auto-gerar conta ao aprovar acordo

### 1. Mover botão "Contas a Pagar" para o FinanceiroHub

**`src/pages/administrativo/FinanceiroHub.tsx`**
- Adicionar item "Contas a Pagar" (ícone `BadgeDollarSign`) ao array `menuItems`, apontando para `/administrativo/financeiro/caixa/contas-a-pagar`
- Ajustar grid desktop para `grid-cols-5` para acomodar 5 itens

**`src/pages/administrativo/CaixaHub.tsx`**
- Remover o item "Contas a Pagar" do array `menuItems`
- Ajustar grid desktop para `grid-cols-2`

### 2. Auto-gerar Conta a Pagar ao aprovar acordo de autorizado

**Abordagem**: Criar um database trigger na tabela `acordos_instalacao_autorizados` que, ao detectar `aprovado_direcao` mudando de `false` para `true`, insere automaticamente um registro na tabela `contas_pagar`.

**Migration SQL**:
```sql
CREATE OR REPLACE FUNCTION public.gerar_conta_pagar_acordo_autorizado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.aprovado_direcao = true AND (OLD.aprovado_direcao IS DISTINCT FROM true) THEN
    INSERT INTO public.contas_pagar (
      descricao,
      valor_parcela,
      data_vencimento,
      categoria,
      status,
      numero_parcela,
      total_parcelas,
      observacoes,
      created_by
    ) VALUES (
      'Acordo Autorizado - ' || NEW.cliente_nome || ' (' || NEW.cliente_cidade || '/' || NEW.cliente_estado || ')',
      NEW.valor_acordado,
      (NEW.data_acordo::date + interval '30 days')::date::text,
      'Autorizados',
      'Pendente',
      1,
      1,
      'Gerado automaticamente pela aprovação do acordo ID: ' || NEW.id,
      NEW.aprovado_direcao_por
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_gerar_conta_pagar_acordo_autorizado
AFTER UPDATE ON public.acordos_instalacao_autorizados
FOR EACH ROW
EXECUTE FUNCTION public.gerar_conta_pagar_acordo_autorizado();
```

Isso garante que a conta é gerada no banco independente de qual página fez a aprovação (AprovacoesAutorizados ou AutorizadosPrecosDirecao), sem precisar alterar código frontend nessas páginas.

### Resultado
- "Contas a Pagar" acessível direto em /administrativo/financeiro
- Toda aprovação de acordo gera automaticamente uma conta a pagar com vencimento 30 dias após a data do acordo, categoria "Autorizados", status "Pendente"

