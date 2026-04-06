

## Plano: Corrigir cascata de token refresh (429) na página de solda

### Diagnóstico
Os logs de autenticação mostram dezenas de eventos `token_revoked` + `SIGNED_IN` em poucos segundos para o mesmo usuário. A causa raiz é uma cascata:

1. **`useProducaoAuth`** reage a **todo** evento `SIGNED_IN` (incluindo token refreshes) fazendo nova query em `admin_users` → atualiza state → re-render
2. Re-render causa nova subscrição dos canais realtime em `useOrdemProducao`
3. Canais realtime disparam `invalidateQueries` → refetch → novo token refresh → loop

### Alterações

**1. `src/hooks/useProducaoAuth.tsx`**
- No `onAuthStateChange`, ignorar `SIGNED_IN` quando o user já está carregado (é apenas token refresh)
- Só processar `SIGNED_IN` quando `user === null` (login real)
- Tratar `TOKEN_REFRESHED` sem re-query desnecessária

**2. `src/hooks/useOrdemProducao.ts`**
- Adicionar `refetchOnWindowFocus: false` e `refetchOnReconnect: false` na query principal para evitar refetchs automáticos que geram mais token refreshes
- Adicionar `staleTime: 30_000` para reduzir frequência de refetchs

### Resultado
Elimina a cascata de refreshes que gera 429. O user só é re-buscado no login real, e a query de ordens não dispara refetchs automáticos excessivos.

### Arquivos alterados
- `src/hooks/useProducaoAuth.tsx` (3 linhas)
- `src/hooks/useOrdemProducao.ts` (3 linhas)

