

# Salvar medidas sem recarregar a página

## Resumo
Remover a chamada `onRefresh()` após salvar as medidas da porta, evitando o recarregamento completo da página. O estado local já contém os valores corretos digitados pelo usuário, então não há necessidade de refetch.

## Alteração técnica

### `src/components/pedidos/MedidasPortasSection.tsx`
- Remover a chamada `onRefresh()` na linha 106 dentro do `handleSalvar`
- O toast de sucesso continua sendo exibido
- Os valores permanecem nos inputs pois já estão no state local `medidas`

Isso é seguro porque:
1. O usuário digitou os valores nos inputs (state local já atualizado)
2. O `supabase.update()` já gravou no banco
3. Não há necessidade de buscar os dados novamente

