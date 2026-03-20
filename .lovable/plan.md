

## Plano: Exibir recorrentes não concluídas no Histórico

### Objetivo
Além das tarefas concluídas, exibir na página de histórico as tarefas recorrentes com status `em_andamento` cuja `data_referencia` já passou (semanas anteriores), indicando que não foram realizadas.

### Alterações em `src/pages/ChecklistHistorico.tsx`

**1. Atualizar a query para buscar também recorrentes não concluídas de semanas passadas**
- Remover o filtro `.eq("status", "concluida")` e buscar também tarefas recorrentes `em_andamento` com `data_referencia` anterior à semana atual
- Adicionar campo `recorrente` e `status` ao select
- Query: buscar tarefas onde `status = concluida` OU (`recorrente = true` AND `status = em_andamento` AND `data_referencia < início da semana atual`)

**2. Atualizar a interface `TarefaConcluida`**
- Renomear para `TarefaHistorico` e adicionar campos `status` e `recorrente`

**3. Diferenciar visualmente na lista**
- Tarefas concluídas: ícone verde (CheckCircle2) como está hoje
- Recorrentes não concluídas: ícone vermelho/amarelo (ex: `XCircle` ou `AlertCircle`) com texto indicando "Não concluída"
- Badge ou indicador visual para distinguir os dois tipos

**4. Adicionar filtro de status**
- Novo filtro no topo: "Todos", "Concluídas", "Não concluídas" para o usuário poder filtrar entre os dois tipos

**5. Atualizar subtitle**
- Mostrar contagem separada (ex: "X concluídas, Y não concluídas")

### Arquivos impactados
- `src/pages/ChecklistHistorico.tsx`

