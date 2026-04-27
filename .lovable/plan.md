## Objetivo

Em `/direcao/gestao-colaboradores`, mudar o comportamento do botão "Desativar colaborador" (ícone `UserX`) para apenas **remover do organograma** sem desativar a conta. O colaborador continua ativo no sistema (mantém acesso) e volta a aparecer no organograma quando for anexado novamente a uma vaga.

## Mudanças

### 1. `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

- Renomear o estado/ação de "desativar" para "remover do organograma" (UI textual e tooltip).
- Trocar o ícone (manter `UserX` ou usar algo neutro — manter `UserX` por simplicidade) e atualizar o `title` para "Remover do organograma".
- Atualizar o `AlertDialog` de confirmação:
  - Título: "Remover do organograma"
  - Descrição: "O colaborador continuará ativo no sistema, mas deixará de aparecer no organograma. Para exibi-lo novamente, anexe-o a uma vaga."
  - Botão de ação: "Remover"
- No `onClick` do `AlertDialogAction`, alterar o update no Supabase de:
  ```ts
  .update({ ativo: false })
  ```
  para:
  ```ts
  .update({ visivel_organograma: false })
  ```
- Manter a criação automática da vaga (`createVaga(...)`) com justificativa atualizada para "Vaga aberta pela remoção de {nome} do organograma".
- Invalidar `['all-users']` para recarregar a listagem.

### 2. `src/components/vagas/SelecionarUsuarioVagaDialog.tsx`

Hoje o seletor usa `useAllUsers`, que filtra `visivel_organograma=true`, então usuários removidos do organograma não apareceriam para reanexar. Ajustar:

- Criar/usar uma busca local que inclua usuários ativos **independente** de `visivel_organograma` (consultar `admin_users` diretamente neste dialog, filtrando `ativo=true` e `tipo_usuario in ('colaborador','metamorfo')`), OU adicionar um parâmetro/hook alternativo `useAllUsersIncludingHidden`.
- Abordagem escolhida: query local dentro deste dialog (mais simples, sem afetar o resto do app que depende de `useAllUsers`).
- No `handleSelect`, ao atribuir o usuário à vaga, atualizar também `visivel_organograma: true` junto com o `role`:
  ```ts
  .update({ role: vagaCargo, visivel_organograma: true })
  ```
- Marcar visualmente (badge "Fora do organograma") os usuários que estão com `visivel_organograma=false` para deixar claro ao gerente.
- Invalidar `['all-users']` após o select.

### 3. `src/components/vagas/PreencherVagaDialog.tsx` (verificar)

Se este dialog também atribui usuário existente a uma vaga, garantir o mesmo comportamento (`visivel_organograma: true` no update). Caso só crie usuário novo (via `create-user` edge function que já define `visivel_organograma: true`), nenhuma mudança é necessária.

## Resultado esperado

- Clicar em "Remover do organograma" em um card de colaborador: remove do organograma, mantém acesso ativo, abre vaga automaticamente para o cargo.
- Ao preencher uma vaga selecionando um colaborador existente (mesmo que esteja fora do organograma), ele volta a aparecer e assume o cargo da vaga.
- Nenhuma conta é desativada por essa ação — apenas oculta do organograma.