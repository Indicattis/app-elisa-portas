

## Plano: Restaurar botão de desativar usuário em /direcao/gestao-colaboradores

### O que será feito

Adicionar um botão de desativação no card de cada colaborador na página de gestão, ao lado do botão "Alterar função" já existente. Incluir um diálogo de confirmação antes de desativar.

### Alterações

**Arquivo**: `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

1. Adicionar import do ícone `UserX` do lucide-react
2. Adicionar estado para controle do diálogo de confirmação de desativação (`userToDeactivate`)
3. No card do usuário (linhas ~261-269), adicionar botão com ícone `UserX` ao lado do botão `ArrowRightLeft`
4. Adicionar `AlertDialog` de confirmação com mensagem clara
5. Implementar função de desativação que faz `update` na tabela `admin_users` setando `ativo = false`
6. Após desativação, invalidar queries relevantes e exibir toast de sucesso

### Detalhe técnico

- O botão aparece no hover do card, junto com o botão de transferência
- Cor vermelha no hover para indicar ação destrutiva
- Diálogo de confirmação obrigatório antes de executar
- Query invalidada: `all-users`

