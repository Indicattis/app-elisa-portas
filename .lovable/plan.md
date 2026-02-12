
# Corrigir drag-and-drop e edicao de instalacoes em /logistica/expedicao

## Problema

Ao arrastar um card de instalacao para outro dia ou editar sua data, a alteracao nao persiste. O toast de sucesso aparece, mas a data nao muda. Isso ocorre porque a atualizacao esta sendo enviada para a tabela `ordens_carregamento` em vez da tabela `instalacoes`.

## Causa raiz

Tres pontos no codigo chamam `updateOrdem` sem passar a propriedade `fonte`, que determina qual tabela atualizar. O valor padrao e `'ordens_carregamento'`, entao instalacoes (que devem atualizar a tabela `instalacoes`) sao enviadas para a tabela errada.

## Correcoes

### 1. Drag semanal (`src/components/expedicao/CalendarioSemanalExpedicaoDesktop.tsx`)

Na funcao `handleDragEnd`, ao tratar ordens normais (linha 175-184), buscar a `fonte` do objeto `ordem` e passar junto, alem de usar o status correto:

```typescript
const ordem = ordens.find((o) => o.id === ordemId);
if (!ordem) return;

// ...
await onUpdateOrdem({
  id: ordemId,
  data: {
    data_carregamento: dataFormatada,
    status: ordem.fonte === 'instalacoes' ? 'pronta_fabrica' : 'agendada',
  },
  fonte: ordem.fonte,
});
```

### 2. Drag mensal (`src/components/expedicao/CalendarioMensalExpedicaoDesktop.tsx`)

Mesmo problema na funcao `handleDragEnd` (linhas 156-168). Precisa receber `ordens` como prop, buscar a ordem pelo ID para obter `fonte`, e passar no update. Tambem ajustar o status.

### 3. Edicao via drawer (`src/pages/logistica/ExpedicaoMinimalista.tsx`)

Na funcao `handleSaveEdit` (linha 97), passar `fonte` do `editingOrdem`:

```typescript
const handleSaveEdit = async (data: any) => {
  if (editingOrdem) {
    await updateOrdem({ 
      id: editingOrdem.id, 
      data,
      fonte: editingOrdem.fonte 
    });
    setEditDrawerOpen(false);
    setEditingOrdem(null);
  }
};
```

## Detalhes tecnicos

### Arquivos editados

1. **`src/components/expedicao/CalendarioSemanalExpedicaoDesktop.tsx`** - Passar `fonte` da ordem no handleDragEnd, usar status correto para instalacoes
2. **`src/components/expedicao/CalendarioMensalExpedicaoDesktop.tsx`** - Adicionar `ordens` como prop, buscar fonte da ordem no handleDragEnd, usar status correto
3. **`src/pages/logistica/ExpedicaoMinimalista.tsx`** - Passar `fonte` no handleSaveEdit e passar `ordens` para o calendario mensal

### Logica de status por fonte
- `fonte === 'instalacoes'`: status deve ser `'pronta_fabrica'`
- `fonte === 'ordens_carregamento'`: status deve ser `'agendada'`

Isso e consistente com o padrao ja usado em `handleRemoverDoCalendario` (linha 119) que ja faz essa distincao corretamente.
