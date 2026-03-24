

## Plano: Corrigir exclusão de itens da missão

### Problema
Quando o usuário exclui um item e clica em salvar (botão Check), o item reaparece. Isso acontece porque o `useEffect` de sincronização no modal re-sincroniza `localCheckboxes` com os dados do servidor. Se a query re-fetcha antes do delete ser commitado no banco, o item deletado é re-adicionado ao estado local.

### Solução
Manter um `Set` de IDs deletados localmente durante a edição. O `useEffect` de sincronização vai ignorar esses IDs, e ao sair do modo edição o set é limpo.

### Alteração: `src/components/todo/DetalhesMissaoModal.tsx`

1. Adicionar `const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())`
2. No `handleDeleteCheckbox`, adicionar o ID ao `deletedIds`
3. No `useEffect` de sync, filtrar também por `!deletedIds.has(cb.id)` ao construir a lista
4. No `handleStartEditing`, limpar `deletedIds`
5. No `handleStopEditing`, limpar `deletedIds`

Isso garante que mesmo que o servidor retorne dados stale, os itens marcados para exclusão não reaparecem durante a edição.

