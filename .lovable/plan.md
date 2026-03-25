

## Plano: Corrigir sincronização de itens no modo edição

### Problema
O `useEffect` de sincronização no `DetalhesMissaoModal.tsx` (linhas 226-241) apenas filtra e atualiza itens já existentes em `localCheckboxes`. Quando um novo checkbox é adicionado via `handleAdicionarItem`, ele é inserido no banco e a query refetcha, mas o novo item do servidor **nunca é adicionado** ao `localCheckboxes` — porque o efeito só opera sobre `prev` existente.

O botão de excluir (X) funciona corretamente: remove do estado local e chama a mutation. O problema real está na sincronização de novos itens.

### Correção em `src/components/todo/DetalhesMissaoModal.tsx`

**1. Atualizar o `useEffect` de sync (linhas 226-241)** para também detectar e adicionar novos itens do servidor que não existam em `localCheckboxes`:

```tsx
useEffect(() => {
  if (editando && missao) {
    setLocalCheckboxes(prev => {
      const localIds = new Set(prev.map(cb => cb.id));
      const serverIds = new Set(missao.missao_checkboxes.map(cb => cb.id));
      
      // Update existing items
      const updated = prev
        .filter(cb => serverIds.has(cb.id) && !deletedIds.has(cb.id))
        .map(cb => {
          const serverCb = missao.missao_checkboxes.find(s => s.id === cb.id);
          if (!serverCb) return cb;
          return { ...cb, prazo: serverCb.prazo, concluida: serverCb.concluida, concluida_em: serverCb.concluida_em };
        });
      
      // Add new items from server (not in local, not deleted)
      const newItems = missao.missao_checkboxes.filter(
        cb => !localIds.has(cb.id) && !deletedIds.has(cb.id)
      );
      
      return [...updated, ...newItems];
    });
  }
}, [editando, missao?.missao_checkboxes, deletedIds]);
```

### Arquivo alterado
- `src/components/todo/DetalhesMissaoModal.tsx` — corrigir useEffect de sync para incluir novos itens do servidor

