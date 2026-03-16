

## Plano: Substituir salário por "Custo do Colaborador" editável no organograma

### Resumo
Adicionar coluna `custo_colaborador` na tabela `admin_users` e substituir a exibição do salário nos cards do organograma por esse novo valor, com edição inline ao clicar.

### Mudanças

**1. Migração SQL**
- Adicionar coluna `custo_colaborador numeric default null` na tabela `admin_users`

**2. `src/hooks/useAllUsers.ts`**
- Adicionar `custo_colaborador?: number | null` na interface `User`

**3. `src/pages/direcao/GestaoColaboradoresDirecao.tsx`**
- Substituir a exibição de `user.salario` por `user.custo_colaborador`
- Ao clicar no valor (ou no placeholder "Definir custo"), abrir um pequeno input inline ou popover para o usuário digitar o valor em R$
- Ao confirmar (Enter ou blur), salvar via `supabase.from("admin_users").update({ custo_colaborador }).eq("id", user.id)` e invalidar a query
- Se não houver custo definido, exibir texto clicável "Definir custo" em tom discreto

