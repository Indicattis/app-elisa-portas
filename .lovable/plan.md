

## Refatorar /administrativo/rh-dp/vagas com layout do Organograma

Substituir a página atual de vagas (tabela com filtros) por um layout idêntico ao `/direcao/gestao-colaboradores`, mas em modo somente-leitura — sem botões de editar/excluir funções, desativar usuários, alterar cargos, criar vagas ou nova função. A única ação disponível será **preencher vagas abertas** clicando no card de vaga.

### Mudanças no arquivo `src/pages/administrativo/VagasPage.tsx`

Reescrever completamente o componente para replicar o layout do `GestaoColaboradoresDirecao.tsx`, com as seguintes diferenças:

1. **Sidebar de setores** — idêntica (mobile chips + desktop sidebar), com placar de ocupação (colaboradores/total).

2. **Grid de colaboradores por função** — mostra todos os roles ativos do setor selecionado, com cards de colaboradores existentes (sem ações de hover como desativar/alterar função) e cards de vagas abertas.

3. **Cards de vaga aberta** — ao clicar, abrem o `PreencherVagaDialog` já existente. Após sucesso, marca a vaga como `preenchida` e invalida as queries.

4. **Sem ações admin** — remover: header com "Nova Vaga", botões de aprovar/recusar, editar/excluir função, desativar colaborador, alterar função, criar função.

5. **Breadcrumbs e navegação** — manter `backPath="/administrativo/rh-dp"` e breadcrumbs corretos.

### Dados necessários (já disponíveis via hooks existentes)
- `useAllUsers()` — colaboradores ativos
- `useVagas()` — vagas e `updateVagaStatus`
- Query `system-roles-active` — roles ativos
- `SETOR_LABELS`, `SETOR_ROLES`, `ROLE_LABELS` — mapeamentos de setor/função

### Arquivo editado
- `src/pages/administrativo/VagasPage.tsx` — reescrita completa

