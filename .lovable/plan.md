

## Plano: Transformar ChecklistLideranca em gestor de tarefas por setor

### O que será feito

A página `ChecklistLideranca` atualmente está fixa no setor "direcao". Vamos transformá-la para permitir selecionar qualquer setor e criar/gerenciar tarefas para cada um deles.

### Implementação

**1. Adicionar seletor de setor na página `ChecklistLideranca.tsx`**
- Substituir o `setor = 'direcao'` fixo por um estado `setorSelecionado`
- Adicionar um `Select` com todos os setores disponíveis (Vendas, Marketing, Instalações, Fábrica, Administrativo) usando `SETOR_LABELS`
- O hook `useTarefas` e `useSetorInfo` passam a usar o setor selecionado
- Manter os botões "Nova Tarefa" e "Recorrentes" funcionando com o setor selecionado
- Passar o `setor` selecionado ao `NovaTarefaModal`

**2. Ajustar layout do header**
- Mover o seletor de setor para uma posição de destaque (abaixo do título ou ao lado)
- Atualizar título dinâmico: "Checklist Liderança - {setorLabel}"

### Detalhes técnicos

- Componente `Select` do shadcn com os 5 setores do `SETOR_LABELS`
- Estado inicial: primeiro setor da lista ou "vendas"
- O `useTarefas(user?.id, setorSelecionado)` já suporta trocar setor dinamicamente
- O `NovaTarefaModal` já recebe prop `setor` e a repassa no submit

