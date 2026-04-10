

## Plano: Remover opção de desativar usuários fora de /admin/users

### Contexto
Atualmente, é possível desativar colaboradores em `/administrativo/financeiro/vagas` (VagasPage) e `/direcao/gestao-colaboradores` (GestaoColaboradoresDirecao). A desativação deve ser exclusiva de `/admin/users`. A página `/administrativo/rh-dp/colaboradores` já não possui essa funcionalidade.

### Alterações

**1. `src/pages/administrativo/VagasPage.tsx`**
- Remover o estado `userToDeactivate`
- Remover os dois botões de `<UserX>` que chamam `setUserToDeactivate(user)` (linhas ~328 e ~420)
- Remover o `AlertDialog` de confirmação de desativação (linhas ~566-597)

**2. `src/pages/direcao/GestaoColaboradoresDirecao.tsx`**
- Remover o estado `userToDeactivate` e `deactivating`
- Remover a função `handleDeactivate`
- Remover os botões de `<UserMinus>` que chamam `setUserToDeactivate` ou `onDeactivateUser` (linhas ~271 e ~795)
- Remover a prop `onDeactivateUser` do componente interno de setor
- Remover o `AlertDialog` de confirmação de desativação (linhas ~813-831)

