
## Plano: Corrigir Erro PGRST116 ao Agendar Instalações

### Causa Raiz Identificada

O erro "JSON object requested, multiple (or no) rows returned" (PGRST116) ocorre porque:

1. O modal de agendamento agora suporta **duas fontes**: `ordens_carregamento` e `instalacoes`
2. O hook `useOrdensCarregamentoCalendario` sempre atualiza na tabela `ordens_carregamento`
3. Quando tentamos agendar uma **instalação**, o ID não existe em `ordens_carregamento`, retornando 0 linhas

```text
┌─────────────────────────────────────────────────────────────┐
│ FLUXO ATUAL (COM ERRO)                                      │
├─────────────────────────────────────────────────────────────┤
│ Modal seleciona ordem de INSTALAÇÃO                         │
│        │                                                    │
│        ▼                                                    │
│ onConfirm({ fonte: 'instalacoes', ... })                    │
│        │                                                    │
│        ▼                                                    │
│ handleConfirmModal ignora 'fonte' → onUpdateOrdem           │
│        │                                                    │
│        ▼                                                    │
│ useOrdensCarregamentoCalendario.updateOrdem                 │
│        │                                                    │
│        ▼                                                    │
│ UPDATE ordens_carregamento WHERE id = [instalacao_id]       │
│        │                                                    │
│        ▼                                                    │
│ ❌ 0 linhas → PGRST116                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### Solução

Atualizar o hook `useOrdensCarregamentoCalendario` para receber a `fonte` e roteamento dinâmico.

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useOrdensCarregamentoCalendario.ts` | Modificar | Adicionar suporte a fonte dinâmica na mutation |
| `src/components/expedicao/DroppableDayExpedicao.tsx` | Modificar | Passar fonte no onUpdateOrdem |
| `src/components/expedicao/DroppableDaySimpleExpedicao.tsx` | Modificar | Passar fonte no onUpdateOrdem |

---

### Parte 1: Atualizar Hook useOrdensCarregamentoCalendario

**Mudanças:**

1. Atualizar a interface do mutation para aceitar `fonte`
2. Rotear o update para a tabela correta
3. Remover `.single()` para evitar erro quando não há retorno

```typescript
// Antes (linha 87-100)
const updateOrdemMutation = useMutation({
  mutationFn: async ({ id, data }: { id: string; data: Partial<OrdemCarregamento> }) => {
    const { data: updated, error } = await supabase
      .from("ordens_carregamento")
      .update({...})
      .eq("id", id)
      .select()
      .single();  // ❌ Causa erro se 0 linhas

    if (error) throw error;
    return updated;
  },
});

// Depois
const updateOrdemMutation = useMutation({
  mutationFn: async ({ 
    id, 
    data,
    fonte = 'ordens_carregamento' 
  }: { 
    id: string; 
    data: Partial<OrdemCarregamento>;
    fonte?: 'ordens_carregamento' | 'instalacoes';
  }) => {
    const tabela = fonte === 'instalacoes' ? 'instalacoes' : 'ordens_carregamento';
    
    const { error } = await supabase
      .from(tabela)
      .update({
        data_carregamento: data.data_carregamento,
        hora: data.hora,
        hora_carregamento: data.hora,
        tipo_carregamento: data.tipo_carregamento,
        responsavel_carregamento_id: data.responsavel_carregamento_id,
        responsavel_carregamento_nome: data.responsavel_carregamento_nome,
        status: data.status || 'agendada',
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
  },
});
```

---

### Parte 2: Atualizar DroppableDayExpedicao

**Mudanças no handleConfirmModal (linhas 110-133):**

Atualmente o modal retorna `fonte` mas o `handleConfirmModal` não usa esse valor. Precisamos:

1. Atualizar a interface do `onConfirm` do modal para incluir `fonte`
2. Passar `fonte` para `onUpdateOrdem`

```typescript
// Antes (linha 110-117)
const handleConfirmModal = async (params: {
  ordemId: string;
  data_carregamento: string;
  hora: string;
  tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro';
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string;
}) => {

// Depois - adicionar fonte
const handleConfirmModal = async (params: {
  ordemId: string;
  fonte: 'ordens_carregamento' | 'instalacoes';  // NOVO
  data_carregamento: string;
  hora: string;
  tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro';
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string;
}) => {
```

E passar `fonte` para `onUpdateOrdem`:

```typescript
// Antes
await onUpdateOrdem({
  id: params.ordemId,
  data: { ... }
});

// Depois
await onUpdateOrdem({
  id: params.ordemId,
  data: { ... },
  fonte: params.fonte  // NOVO
});
```

---

### Parte 3: Atualizar Props de onUpdateOrdem

Todos os componentes que usam `onUpdateOrdem` precisam atualizar a interface:

```typescript
// Antes
onUpdateOrdem?: (params: { id: string; data: Partial<OrdemCarregamento> }) => Promise<void>;

// Depois
onUpdateOrdem?: (params: { 
  id: string; 
  data: Partial<OrdemCarregamento>;
  fonte?: 'ordens_carregamento' | 'instalacoes';
}) => Promise<void>;
```

Arquivos que precisam dessa mudança de interface:
- `DroppableDayExpedicao.tsx`
- `DroppableDaySimpleExpedicao.tsx`
- `DiaCardExpedicao.tsx`
- `CalendarioSemanalExpedicaoDesktop.tsx`
- `CalendarioSemanalExpedicaoMobile.tsx`
- `CalendarioMensalExpedicaoDesktop.tsx`

---

### Parte 4: Atualizar Página ExpedicaoMinimalista

```typescript
// Antes (linha 86-88)
const handleUpdateOrdem = async (params: { id: string; data: Partial<OrdemCarregamento> }) => {
  await updateOrdem(params);
};

// Depois
const handleUpdateOrdem = async (params: { 
  id: string; 
  data: Partial<OrdemCarregamento>;
  fonte?: 'ordens_carregamento' | 'instalacoes';
}) => {
  await updateOrdem(params);
};
```

---

### Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│ FLUXO CORRIGIDO                                             │
├─────────────────────────────────────────────────────────────┤
│ Modal seleciona ordem de INSTALAÇÃO                         │
│        │                                                    │
│        ▼                                                    │
│ onConfirm({ fonte: 'instalacoes', ... })                    │
│        │                                                    │
│        ▼                                                    │
│ handleConfirmModal recebe fonte → onUpdateOrdem({ fonte })  │
│        │                                                    │
│        ▼                                                    │
│ updateOrdem verifica fonte                                  │
│        │                                                    │
│        ▼                                                    │
│ fonte === 'instalacoes' ? UPDATE instalacoes                │
│                        : UPDATE ordens_carregamento         │
│        │                                                    │
│        ▼                                                    │
│ ✅ Sucesso                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### Resultado Esperado

1. Agendamento de **entregas** continua funcionando (tabela `ordens_carregamento`)
2. Agendamento de **instalações** passa a funcionar (tabela `instalacoes`)
3. Erro PGRST116 é eliminado
4. Drag-and-drop no calendário também funcionará corretamente com ambos os tipos
