

## Plano: Etapa de seleção de usuário existente antes de criar novo

### O que será feito

Ao clicar em "Preencher Vaga", em vez de abrir diretamente o modal de criação de usuário, será exibido um dialog intermediário listando todos os usuários ativos. O gestor poderá selecionar um usuário existente para atribuir à vaga, ou optar por criar um novo colaborador (abrindo o modal atual).

### Alterações

**1. Criar componente `src/components/vagas/SelecionarUsuarioVagaDialog.tsx`**
- Dialog com lista de usuários ativos (vindos de `useAllUsers`)
- Campo de busca para filtrar por nome
- Cada item mostra avatar, nome, cargo atual e setor
- Botão "Selecionar" ao lado de cada usuário
- Botão "Criar Novo Colaborador" no rodapé para abrir o `PreencherVagaDialog`
- Ao selecionar um usuário existente, atualizar o `role` dele na `admin_users` com o cargo da vaga e marcar a vaga como preenchida

**2. Alterar `src/pages/direcao/GestaoColaboradoresDirecao.tsx`**
- Ao clicar "Preencher Vaga", abrir o novo `SelecionarUsuarioVagaDialog` em vez do `PreencherVagaDialog`
- Adicionar estado `selecionarUsuarioOpen` para controlar o novo dialog
- O botão "Criar Novo" dentro do novo dialog abrirá o `PreencherVagaDialog` existente
- Ao selecionar usuário existente: atualizar role via supabase, marcar vaga como preenchida, invalidar queries

### Fluxo
```text
Clique "Preencher Vaga"
  → Abre SelecionarUsuarioVagaDialog (lista usuários ativos)
    → Opção A: Selecionar usuário existente → Atualiza role → Vaga preenchida
    → Opção B: "Criar Novo" → Abre PreencherVagaDialog (comportamento atual)
```

