

## Plano: Separar Programação e adicionar Calendário de Tarefas

### Resumo

1. Criar nova página `ChecklistProgramacao.tsx` com a seção "Programação Semanal" (movida de `ChecklistLideranca.tsx`)
2. Adicionar rota `/direcao/checklist-lideranca/programacao`
3. Adicionar botão "Programação" no header do `ChecklistLideranca.tsx`
4. Substituir a seção removida por um calendário semanal de tarefas (usando `useTarefasCalendario`)

### Alterações

#### 1. Nova página `src/pages/ChecklistProgramacao.tsx`
- Mover toda a seção "Programação Semanal" (grid de 7 colunas, filtro de responsável, modais de template) para esta nova página
- Usar `MinimalistLayout` com breadcrumb incluindo "Checklist Liderança" como pai
- Manter os botões de ação relevantes (Nova Tarefa, Recorrentes) no header
- Mover states e lógica associados: `filtroResponsavel`, `templateParaDeletar`, `modalRecorrenteAberto`, `modalRecorrentes`, `templateSelecionado`, e seus modais

#### 2. `src/App.tsx`
- Adicionar rota: `/direcao/checklist-lideranca/programacao` → `ChecklistProgramacao`
- Adicionar import do novo componente

#### 3. `src/pages/ChecklistLideranca.tsx`
- Adicionar botão "Programação" no `headerActions` (com ícone `CalendarDays`, navega para `/direcao/checklist-lideranca/programacao`)
- Remover a seção "Programação Semanal" (linhas ~152-338) e states/lógica associados
- Adicionar nova seção "Calendário de Tarefas" no lugar, usando `useTarefasCalendario`:
  - Navegação semanal (anterior/próxima semana, botão "Hoje")
  - Grid de 7 dias mostrando tarefas com status (pendente/concluída), avatar do responsável
  - Estilo glassmorphism consistente (bg-white/5, border-white/10)
  - Reutilizar padrão visual do `CalendarioSemanalTarefasMobile` / `DiaCardTarefa` adaptado ao tema escuro

