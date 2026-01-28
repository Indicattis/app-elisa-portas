
## Plano: Corrigir Erros de Agendamento de Instalações e Remover Campo de Hora

### Problemas Identificados

#### 1. Erro PGRST116
O erro `PGRST116: "JSON object requested, multiple (or no) rows returned"` ocorre quando a query Supabase usa `.single()` e retorna 0 linhas. Isso está acontecendo em vários hooks de update.

**Hooks afetados:**

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `useOrdensInstalacaoCalendario.ts` | 128-133 | `.select().single()` no update |
| `useOrdensCarregamentoInstalacao.ts` | 136-144 | `.select().single()` no update |
| `useOrdensSemDataCarregamento.ts` | 68-76 | `.select().single()` no update |

#### 2. Campo de Hora Desnecessário
O modal `AdicionarOrdemCalendarioModal` ainda solicita o horário para instalações, mas conforme a regra de negócio definida, instalações seguem uma política de **apenas data** (date-only policy).

### Solução Proposta

#### 1. Remover `.single()` das Mutations de Update

Substituir `.select().single()` por apenas `.select()` ou remover completamente a seleção quando o retorno não é necessário.

```typescript
// ANTES (causa erro se 0 rows)
const { data: updated, error } = await supabase
  .from("instalacoes")
  .update(updateData)
  .eq("id", id)
  .select()
  .single();

// DEPOIS (não falha se 0 rows)
const { error } = await supabase
  .from("instalacoes")
  .update(updateData)
  .eq("id", id);
```

#### 2. Ocultar Campo de Hora para Instalações/Manutenções

No `AdicionarOrdemCalendarioModal`, ocultar o campo de horário quando o tipo de entrega for `instalacao` ou `manutencao`, e definir um valor padrão (null ou "08:00") automaticamente.

```typescript
// Verificar se é entrega (precisa de hora) ou instalação (não precisa)
const isEntrega = ordemSelecionada?.tipo_entrega === 'entrega';

// Só mostrar campo de hora para entregas
{isEntrega && (
  <div className="space-y-2">
    <Label htmlFor="hora">Horário *</Label>
    <Input type="time" ... />
  </div>
)}
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useOrdensInstalacaoCalendario.ts` | Remover `.single()` do `updateInstalacaoMutation` |
| `src/hooks/useOrdensCarregamentoInstalacao.ts` | Remover `.single()` do `updateOrdemMutation` |
| `src/hooks/useOrdensSemDataCarregamento.ts` | Remover `.single()` do `updateOrdemMutation` |
| `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx` | Ocultar campo de hora para instalações |

### Detalhes Técnicos

#### Padrão Seguro para Updates

```typescript
// Pattern recomendado - sem .single()
const updateMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    const { error } = await supabase
      .from("tabela")
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
  },
  // ...
});
```

#### Lógica de Hora para Modal

```typescript
// Hora obrigatória apenas para entregas
const handleConfirm = async () => {
  // Para instalações, usar null ou valor padrão
  const horaFinal = isEntrega ? hora : null;
  
  await onConfirm({
    ...params,
    hora: horaFinal,
  });
};
```

### Resultado Esperado

- Agendamento de instalações via listagem funcionará sem erros
- Campo de hora não será mais exibido para instalações/manutenções
- Updates que não encontram registros não causarão erros fatais
- Consistência com a política de "apenas data" para instalações
