
# Correcao: Calendario Expedicao - Atualizacao Instantanea e Remocao do Calendario

## Problemas Identificados

### Problema 1: "Remover do calendario" nao funciona
Em `ExpedicaoMinimalista.tsx` (linha 111-119), o `handleRemoverDoCalendario` nao passa o campo `fonte` ao chamar `updateOrdem`. Como o calendario combina ordens de duas tabelas (`ordens_carregamento` e `instalacoes`), quando a ordem vem da tabela `instalacoes`, a atualizacao tenta modificar a tabela errada (`ordens_carregamento`) e falha silenciosamente.

```typescript
// ATUAL (bug) - linha 111-119:
const handleRemoverDoCalendario = (ordemId: string) => {
  updateOrdem({ 
    id: ordemId, 
    data: { data_carregamento: null, status: 'pendente' } 
    // FALTA: fonte da ordem!
  });
};
```

### Problema 2: Calendario e listagem nao atualizam instantaneamente
1. O `handleRemoverDoCalendario` nao usa `await`, entao o toast aparece antes da operacao completar.
2. Apos remocao/agendamento, as queries da listagem (`ordens-carregamento-disponiveis`) nao sao invalidadas.
3. A subscription em tempo real so escuta a tabela `ordens_carregamento` mas nao a tabela `instalacoes`.
4. A mutation `onSuccess` no hook `useOrdensCarregamentoCalendario` nao invalida `ordens-carregamento-disponiveis`.

---

## Correcoes

### Arquivo: `src/pages/logistica/ExpedicaoMinimalista.tsx`

**Correcao 1**: Passar `fonte` no `handleRemoverDoCalendario` buscando a ordem correta dos dados:

```typescript
const handleRemoverDoCalendario = async (ordemId: string) => {
  // Encontrar a ordem para saber a fonte
  const ordem = ordens?.find(o => o.id === ordemId);
  const fonte = ordem?.fonte || 'ordens_carregamento';
  
  await updateOrdem({ 
    id: ordemId, 
    data: { 
      data_carregamento: null, 
      status: 'pendente' 
    },
    fonte
  });
  
  queryClient.invalidateQueries({ queryKey: ['ordens-carregamento-disponiveis'] });
  toast.success("Ordem removida do calendário");
};
```

### Arquivo: `src/hooks/useOrdensCarregamentoCalendario.ts`

**Correcao 2**: Na mutation `onSuccess`, tambem invalidar `ordens-carregamento-disponiveis`:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario"] });
  queryClient.invalidateQueries({ queryKey: ["ordens_carregamento"] });
  queryClient.invalidateQueries({ queryKey: ["instalacoes"] });
  queryClient.invalidateQueries({ queryKey: ["ordens-carregamento-disponiveis"] });
},
```

**Correcao 3**: Adicionar subscription na tabela `instalacoes` para atualizacao em tempo real:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('ordens-carregamento-calendar-changes')
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'ordens_carregamento'
    }, () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario", inicio, fim] });
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'instalacoes'
    }, () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario", inicio, fim] });
      queryClient.invalidateQueries({ queryKey: ["ordens-carregamento-disponiveis"] });
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [inicio, fim, queryClient]);
```

**Correcao 4**: Corrigir a logica de update para `instalacoes` quando a operacao for remover do calendario (status e campos corretos):

```typescript
// Dentro do mutationFn, caso fonte === 'instalacoes':
if (fonte === 'instalacoes') {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  };
  
  if (data.data_carregamento !== undefined) updateData.data_carregamento = data.data_carregamento;
  if (data.hora !== undefined) updateData.hora_carregamento = data.hora;
  if (data.tipo_carregamento !== undefined) updateData.tipo_carregamento = data.tipo_carregamento;
  if (data.responsavel_carregamento_id !== undefined) updateData.responsavel_carregamento_id = data.responsavel_carregamento_id;
  if (data.responsavel_carregamento_nome !== undefined) updateData.responsavel_carregamento_nome = data.responsavel_carregamento_nome;
  if (data.status !== undefined) updateData.status = data.status;
  
  const { error } = await supabase
    .from("instalacoes")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
}
```

---

## Resultado Esperado

- Clicar em "Remover do calendario" vai funcionar para ordens de ambas as tabelas
- O calendario atualiza instantaneamente apos agendamento ou remocao
- A listagem de ordens disponiveis tambem atualiza instantaneamente
- Mudancas feitas por outros usuarios aparecem em tempo real (via subscriptions)
