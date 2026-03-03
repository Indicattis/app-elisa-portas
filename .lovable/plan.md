

# Fix: Ordem concluida mas ainda marcada como pausada

## Problema
A ordem `OSL-2026-0052` do pedido `44741b47` foi concluida pelo caminho administrativo (`useVendasPedidos.concluirOrdem`), que so atualiza `status` e `data_conclusao`, sem limpar os campos de pausa (`pausada`, `justificativa_pausa`, `linha_problema_id`). O pedido nao avanca porque a validacao em `usePedidosEtapas.ts` (linha 706) bloqueia qualquer ordem com `pausada === true`, independente do status.

## Solucao (2 partes)

### 1. Corrigir dado inconsistente no banco
Executar SQL para limpar os campos de pausa da ordem ja concluida:

```sql
UPDATE ordens_soldagem
SET pausada = false, justificativa_pausa = null, pausada_em = null, linha_problema_id = null
WHERE id = '29d6a062-edf4-417c-97ba-d2148837de62';
```

### 2. Corrigir `useVendasPedidos.ts` (linhas 362-368)
Adicionar limpeza dos campos de pausa no `concluirOrdem` para evitar reincidencia:

```typescript
.update({
  status: "concluido",
  data_conclusao: new Date().toISOString(),
  pausada: false,
  pausada_em: null,
  justificativa_pausa: null,
  ...(tipo !== "qualidade" ? { linha_problema_id: null } : {}),
})
```

### 3. Tornar validacao mais resiliente em `usePedidosEtapas.ts` (linha 706)
Alterar a verificacao para ignorar ordens ja concluidas:

```typescript
const ordemPausada = ordens.find(o => o.pausada === true && o.status !== 'concluido');
```

Isso garante que mesmo se houver inconsistencia nos dados, ordens concluidas nao bloqueiem o avanco.

