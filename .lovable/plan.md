

## Plano: Corrigir erro de constraint ao agendar ordem na expedição (mobile)

### Problema
Ao clicar no "+" e confirmar no `AdicionarOrdemCalendarioModal`, o código define `status: 'agendada'` para todos os tipos de fonte. Porém, a tabela `instalacoes` tem um CHECK constraint que só aceita `'pendente_producao'`, `'pronta_fabrica'` e `'finalizada'`. Isso causa o erro `instalacoes_status_check`.

### Solução

**Arquivo: `src/hooks/useOrdensCarregamentoCalendario.ts`**

1. No bloco `fonte === 'instalacoes'` (linhas ~295-305), ao fazer UPDATE, **não** aplicar `data.status` se o valor for `'agendada'` — manter o status existente ou usar `'pronta_fabrica'`
2. No bloco de orphan insert para `instalacoes` (linhas ~273-291), o status já está correto como `'pronta_fabrica'`, mas garantir que `data.status` não sobrescreva com `'agendada'`

**Arquivo: `src/components/expedicao/DiaCardExpedicao.tsx`**

1. Na função `handleConfirmModal` (~linha 108-116), ao montar o objeto `data`, condicionar o `status` com base na `fonte`: se `fonte === 'instalacoes'`, usar `'pronta_fabrica'` ao invés de `'agendada'`; se `fonte === 'correcoes'`, verificar constraint similar

Isso garante que o status enviado respeite o constraint de cada tabela.

