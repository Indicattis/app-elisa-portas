

## Plano: Simplificar Checklist Liderança — apenas Programação Semanal

### Resumo
Remover toda a seção "Tarefas da Semana" (calendário, filtros, navegação semanal, tabela de tarefas) e manter apenas a seção "Programação Semanal" como conteúdo principal. Trocar o botão "Nova Tarefa" no header por um botão que abre o modal `NovaRecorrenteModal` para cadastrar templates na programação.

### Alterações em `src/pages/ChecklistLideranca.tsx`

**1. Remover toda a Seção 1 (Tarefas da Semana)**
- Remover o bloco JSX da seção de tarefas (linhas 193-289)
- Remover estados não usados: `usuarioSelecionado`, `tipoSelecionado`, `statusSelecionado`, `dataSelecionada`, `mostrarLixeira`, `semanaOffset`, `diaCalendario`, `modalAberto`, `tarefaParaDeletar`
- Remover lógica não usada: `semanaAtual`, `tarefasDaSemana`, `tarefasFiltradas`, `tarefasAtivas`, `tarefasConcluidas`, `totalEmAndamento`, `totalConcluidas`, `labelSemana`
- Remover imports não usados: `CalendarioSemanal`, `ChecklistFiltros`, `TarefasTabela`, `NovaTarefaModal`, `isSameDay`, `parseISO`, `startOfWeek`, `endOfWeek`, `isWithinInterval`, `addWeeks`, `subWeeks`, `ChevronLeft`, `ChevronRight`, `Trash`, `Calendar`
- Remover o modal `NovaTarefaModal` e o `AlertDialog` de deleção de tarefa
- Remover o FAB mobile que abria o modal de nova tarefa

**2. Atualizar header actions**
- Remover botão "Nova Tarefa" (que abria `NovaTarefaModal`)
- Manter botão "Recorrentes" (lista de templates)
- Renomear/manter botão "Nova Recorrente" como botão principal com estilo blue gradient (ícone `+` e texto "Nova Tarefa") que abre o `NovaRecorrenteModal`

**3. Programação Semanal como seção principal**
- Mover a seção de Programação para ser o único conteúdo, sem alterações visuais

### Arquivo impactado
- `src/pages/ChecklistLideranca.tsx` (limpeza significativa, ~200 linhas removidas)

