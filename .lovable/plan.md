

## Plano: Ajustar tela Minhas Tarefas

### Mudanças

**1. Animação da direita para esquerda**
- Trocar `'-translate-x-full'` por `'translate-x-full'` no estado fechado, fazendo o painel entrar pela direita.

**2. Exibir somente tarefas pendentes da semana**
- Filtrar `tarefasPendentes` para mostrar apenas tarefas com `data_referencia` dentro da semana atual (segunda a domingo).
- Remover a seção "Concluídas recentemente" que lista tarefas já finalizadas.
- Atualizar o título da seção para "Tarefas da Semana".

**3. Checkboxes de missões inline (sem modal)**
- Remover o `DetalhesMissaoModal` e todo o estado associado (`missaoSelecionada`, `missaoModalOpen`).
- Trocar o card de missão de `<button>` clicável para um `<div>` estático.
- Exibir **todos** os checkboxes da missão (não só preview de 3) com `Checkbox` interativo do Radix.
- Ao marcar/desmarcar um checkbox, chamar `toggleCheckbox.mutate()` diretamente na tela.
- Manter progress bar e badge de atraso no card.

### Arquivo editado
- `src/components/MinhasTarefasFullscreen.tsx`

### Detalhes técnicos
- Para filtro da semana: usar `startOfWeek` e `endOfWeek` do `date-fns` com `{ weekStartsOn: 1 }` (segunda).
- Comparar `tarefa.data_referencia` contra o intervalo da semana.
- Cada checkbox renderizado com `<Checkbox checked={cb.concluida} onCheckedChange={...} />` e descrição ao lado, com badge "atrasado" quando aplicável.

