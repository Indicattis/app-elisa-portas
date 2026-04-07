
Plano: estabilizar a autenticação das rotas de produção

Diagnóstico
- O cadastro dos dois usuários existe e está ativo em `admin_users`:
  - `7087` = Elton Luiz de Paula, papel `soldador`
  - `4063` = Guilherme Martini, papel `coringa`
- O redirecionamento para `/producao/login` não é um problema de CPF/login em si; ele acontece depois, na restauração da sessão ao entrar nas páginas de produção.
- Hoje há 2 instâncias separadas de `ProducaoAuthProvider` em `src/App.tsx`: uma para `/producao` e outra para `/producao/*`. Ao sair da home e entrar em `/producao/solda` (ou outra página), o contexto é desmontado e montado de novo.
- Em `src/hooks/useProducaoAuth.tsx`, o fluxo ainda é frágil:
  - chama `getSession()` antes de registrar o `onAuthStateChange`
  - em qualquer falha ao buscar `admin_users`, faz `supabase.auth.signOut()`
- Isso combina com os logs de `refresh_token_not_found` / `SIGNED_OUT`: em alguns computadores a sessão cai durante essa remontagem e o usuário volta para o login.

Implementação
1. `src/App.tsx`
- Unificar todas as rotas de produção sob um único `ProducaoAuthProvider`.
- Reestruturar `/producao` como rota pai com filhos (`index`, `solda`, `perfiladeira`, etc.), evitando recriar o contexto a cada troca de página.

2. `src/hooks/useProducaoAuth.tsx`
- Extrair um helper único para carregar o registro de `admin_users`.
- Registrar `onAuthStateChange` antes de `getSession()`.
- Processar `SIGNED_IN` apenas quando o usuário local ainda não estiver carregado ou quando o `user.id` mudar.
- Remover o `signOut()` automático em erro transitório de consulta; só limpar sessão quando realmente não existir sessão válida.
- Adicionar um estado explícito de “auth inicializada” para as rotas protegidas esperarem a recuperação completa.

3. `src/components/ProtectedProducaoRoute.tsx`
- Passar a usar esse estado de inicialização para não redirecionar cedo demais.
- Só verificar `routeKey` depois que a sessão estiver estável.

4. `src/pages/producao/ProducaoLogin.tsx`
- Após `signInWithPassword`, navegar apenas quando a sessão estiver confirmada.
- Respeitar a rota de origem (`state.from`) em vez de sempre mandar para `/producao`.

5. `src/hooks/useOrdemProducao.ts`
- Amarrar as subscriptions realtime ao usuário carregado para reduzir reações durante a montagem inicial da página.

Observação importante de permissão
- O usuário `4063` atualmente não tem acesso a `producao_solda` no `user_route_access`.
- Então, depois da correção de sessão:
  - se ele deve acessar Solda, será preciso conceder essa permissão também;
  - se não deve, o comportamento correto será cair em `/producao/forbidden`, e não voltar para o login.

Resultado esperado
- Os usuários `7087` e `4063` deixam de ser jogados de volta para `/producao/login` ao abrir páginas da produção.
- O sistema só volta para login quando realmente não houver sessão válida.
- Falta de permissão passa a resultar em `forbidden`, não em logout aparente.

Detalhes técnicos
- Arquivos principais:
  - `src/App.tsx`
  - `src/hooks/useProducaoAuth.tsx`
  - `src/components/ProtectedProducaoRoute.tsx`
  - `src/pages/producao/ProducaoLogin.tsx`
  - `src/hooks/useOrdemProducao.ts`
- Ajuste de banco não é obrigatório para o bug principal; apenas pode ser necessário para a permissão do usuário `4063`, dependendo da regra desejada.
