

## Plano: Bloquear marcação de tarefas atrasadas

### Mudança

No `MinhasTarefasFullscreen.tsx`, para cada tarefa da semana, verificar se `data_referencia` já passou (comparando com `startOfDay(new Date())`). Se passou:

- Desabilitar o clique (trocar `<button>` por `<div>` ou adicionar condição no `onClick`)
- Reduzir opacidade do card (`opacity-50`)
- Mostrar badge/texto "Atrasada" em vermelho/âmbar
- Trocar o ícone `Circle` por `AlertTriangle` em âmbar

### Arquivo
- `src/components/MinhasTarefasFullscreen.tsx` — linhas 113-130: adicionar verificação `isPast(startOfDay(new Date(tarefa.data_referencia + 'T00:00:00')))` e condicionar o `onClick` e estilo.

