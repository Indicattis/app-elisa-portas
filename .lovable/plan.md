
Plano: corrigir o loop de login do usuário 4063 em /producao

Diagnóstico confirmado
- O usuário 4063 está ativo em `admin_users`, com `user_id = 340540a5-a5ff-4485-aaaf-27a985c8d934`.
- Ele já tem `producao_hub`, então o problema não é permissão para entrar em `/producao`.
- A Edge Function `manage-producao-auth` está sendo chamada para o CPF 4063.
- Os logs repetidos de `Auth state changed: SIGNED_IN ...` vêm de `src/hooks/useAuth.tsx` (auth global), não do auth específico da produção.
- Como o `AuthProvider` global envolve todo o app em `src/App.tsx`, ele compartilha a mesma sessão do Supabase com `/producao` e está interferindo no login da produção.
- Além disso, a função `manage-producao-auth` ainda faz `updateUserById` no usuário existente a cada login, o que aumenta a instabilidade da sessão.

O que vou ajustar

1. `src/hooks/useAuth.tsx`
- Remover o callback `async` do `onAuthStateChange`.
- Ignorar `SIGNED_IN` repetido para o mesmo usuário.
- Ignorar `TOKEN_REFRESHED` sem refazer carga desnecessária.
- Remover o `supabase.auth.signOut()` no erro de `getSession()`, para o auth global não derrubar a sessão da produção.
- Adicionar trava por `currentUserId` para evitar refetchs em cascata de `admin_users`.

2. `src/hooks/useProducaoAuth.tsx`
- Separar “sessão existe” de “perfil carregado”.
- Se a sessão existir, não limpar o usuário para `null` por falha transitória ao buscar `admin_users`.
- Só mandar para login quando houver ausência real de sessão (`SIGNED_OUT` / sem sessão confirmada).
- Manter loading/retry curto durante hidratação, em vez de cair direto no redirect.

3. `src/pages/producao/ProducaoLogin.tsx`
- Sanitizar o `from` para nunca navegar de volta para `/producao/login`.
- Após `signInWithPassword`, confirmar a sessão antes de navegar.
- Navegar para `/producao` como fallback seguro.

4. `supabase/functions/manage-producao-auth/index.ts`
- Parar de resetar a senha do usuário existente em todo login.
- Atualizar apenas quando realmente necessário (ex.: criar usuário novo ou sincronizar metadados sem trocar senha).
- Isso reduz revogação de tokens e ajuda a eliminar o loop/429.

5. `src/App.tsx` (se necessário no fechamento)
- Manter a estrutura atual apenas se os ajustes acima forem suficientes.
- Se ainda houver interferência, isolar as rotas `/producao` do `AuthProvider` global, após checar os poucos pontos que ainda usam `useAuth` no contexto de produção.

Resultado esperado
- O usuário 4063 consegue autenticar e entrar em `/producao`.
- O sistema para de retornar automaticamente para `/producao/login`.
- Falta de permissão passa a resultar em `/producao/forbidden`, não em logout aparente.
- A frequência de eventos auth e erros 429 cai significativamente.

Arquivos-alvo
- `src/hooks/useAuth.tsx`
- `src/hooks/useProducaoAuth.tsx`
- `src/pages/producao/ProducaoLogin.tsx`
- `supabase/functions/manage-producao-auth/index.ts`
- `src/App.tsx` (somente se precisar isolar de vez o auth global)

Banco de dados
- Nenhuma alteração de banco é necessária para este problema.
