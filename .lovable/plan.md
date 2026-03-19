

## Plano: Adicionar gestão semanal de tarefas por colaborador ao Checklist Liderança

### O que será feito

Integrar na página `ChecklistLideranca` as funcionalidades de gestão semanal que já existem no `DirecaoChecklist`: calendário semanal, navegação entre semanas, tabela de tarefas com responsável/hora/status, filtros por colaborador, e botão de programação (recorrentes).

### Implementação

**1. Atualizar `ChecklistLideranca.tsx`**
- Adicionar estados para navegação semanal (`semanaOffset`), dia do calendário, filtros (usuário, tipo, status, data), e toggle lixeira
- Importar e usar os componentes já existentes: `CalendarioSemanal`, `TarefasTabela`, `ChecklistFiltros`
- Adicionar lógica de filtragem por semana (usando `startOfWeek`/`endOfWeek`/`isWithinInterval`) e filtros adicionais
- Adicionar navegação entre semanas (anterior/próxima/hoje) no card de tarefas
- Substituir as listas simples de cards por `TarefasTabela` com responsável, hora, status e tipo
- Manter o seletor de setor, botões "Nova Tarefa" e "Recorrentes", e o card do responsável

**2. Layout final da página**
- Header: Voltar + Título + Seletor de setor + Card responsável + Botões ação
- Calendário semanal (componente existente)
- Filtros (componente existente `ChecklistFiltros`)
- Card de tarefas com navegação de semana + `TarefasTabela`
- FAB mobile para Nova Tarefa

### Detalhes técnicos

Todos os componentes necessários já existem (`CalendarioSemanal`, `TarefasTabela`, `ChecklistFiltros`). A mudança é essencialmente reorganizar `ChecklistLideranca.tsx` para usar o mesmo padrão do `DirecaoChecklist.tsx`, mantendo o filtro por setor como diferencial.

