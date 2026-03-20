

## Plano: Adicionar botão "Histórico" no header + nova página de histórico

### Alterações

**1. Nova página `src/pages/ChecklistHistorico.tsx`**
- Página com `MinimalistLayout` (mesmo estilo glassmorphism)
- Breadcrumb: Home > Direção > Checklist Liderança > Histórico
- Busca tarefas com status `concluida` usando query no Supabase (tabela de tarefas, com joins em responsável/criador)
- Lista as tarefas concluídas com: descrição, responsável (avatar + nome), data de conclusão
- Filtro por responsável e por período (date range)
- Botão voltar para `/direcao/checklist-lideranca`

**2. `src/pages/ChecklistLideranca.tsx`** — Adicionar botão "Histórico" no `headerActions`
- Novo botão com ícone `History` (lucide) entre "Recorrentes" e "Nova Tarefa"
- Estilo glass igual ao botão "Recorrentes" (`bg-white/5 border-white/10`)
- Navega para `/direcao/checklist-lideranca/historico`

**3. `src/App.tsx`** — Adicionar rota
- Nova rota: `/direcao/checklist-lideranca/historico` → `ChecklistHistorico` com `ProtectedRoute` key `direcao_hub`

### Arquivos impactados
- `src/pages/ChecklistHistorico.tsx` (novo)
- `src/pages/ChecklistLideranca.tsx` (botão no header)
- `src/App.tsx` (rota)

