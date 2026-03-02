

# Adicionar opcao de Ativar/Desativar usuarios em /admin/users

## Contexto
O campo `ativo` ja existe na tabela `admin_users` e a edge function `manage-producao-auth` ja filtra por `ativo = true`, impedindo login de usuarios inativos via CPF. Porem, nao ha um controle visivel na interface para alternar esse status.

## Alteracoes

### 1. Botao de ativar/desativar na lista de usuarios (`AdminUsersMinimalista.tsx`)
- Adicionar um botao com icone `UserX` (desativar) ou `UserCheck` (ativar) ao lado dos botoes de editar e resetar senha
- Ao clicar, exibir um dialog de confirmacao (AlertDialog) perguntando se deseja desativar/ativar o usuario
- Ao confirmar, atualizar `ativo` na tabela `admin_users` e recarregar a lista
- Mostrar toast de sucesso/erro

### 2. Switch no modal de detalhes (`UserDetailsModal.tsx`)
- Adicionar um Switch ao lado do badge "Ativo/Inativo" no header do modal
- Passar callback `onToggleAtivo` do componente pai para o modal
- Ao alternar, executar a mesma logica de confirmacao e update

### Detalhes tecnicos

**`src/pages/admin/AdminUsersMinimalista.tsx`**:
- Importar `AlertDialog` e icones `UserX`/`UserCheck`
- Criar estado `togglingUser` para controlar o dialog de confirmacao
- Criar funcao `handleToggleAtivo(user)` que faz `supabase.from('admin_users').update({ ativo: !user.ativo }).eq('id', user.id)` e chama `fetchUsers()`
- Adicionar botao na area de acoes de cada usuario (ao lado de Editar e Resetar Senha)
- Passar `onToggleAtivo` ao `UserDetailsModal`

**`src/components/admin/UserDetailsModal.tsx`**:
- Aceitar nova prop `onToggleAtivo?: (userId: string, novoStatus: boolean) => void`
- Substituir o Badge estatico "Ativo/Inativo" por um Switch clicavel que chama `onToggleAtivo`

### Seguranca
O login via CPF ja e bloqueado para usuarios inativos (filtro `ativo = true` na edge function). Nenhuma alteracao no backend e necessaria.

