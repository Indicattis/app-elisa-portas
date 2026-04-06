

## Plano: Corrigir erro 429 (Too Many Requests) na página de solda

### Problema
O `useQuery` no hook `useOrdemProducao` não possui guard `enabled` baseado no estado de autenticação. Quando o usuário acessa `/producao/solda`, a query dispara antes da sessão estar restaurada, gerando múltiplas tentativas de refresh de token e resultando em 429.

### Solução
Adicionar `enabled: !!user` ao `useQuery` principal do `useOrdemProducao`, passando o `user` como parâmetro ou utilizando o `useProducaoAuth` internamente.

Como o hook `useOrdemProducao` é usado por várias páginas de produção (solda, perfiladeira, separação, qualidade), a correção beneficia todas.

### Alteração

**`src/hooks/useOrdemProducao.ts`**
- Importar `useProducaoAuth` 
- Obter `user` do contexto
- Adicionar `enabled: !!user` na query principal (linha 83)
- Incluir `user?.user_id` na `queryKey` para invalidação correta

### Arquivo alterado
- `src/hooks/useOrdemProducao.ts` — 3 linhas adicionadas/modificadas

