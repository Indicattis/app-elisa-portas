

## Plano: Mostrar botões do header para todos os usuários

### Alteração
Remover a condição `podeGerenciar` que guarda o `headerActions`, fazendo com que os botões "Recorrentes" e "Nova Tarefa" apareçam para todos os usuários independente do role.

### Arquivo impactado
- `src/pages/ChecklistLideranca.tsx` — Mudar `headerActions` de condicional para sempre definido (remover o ternário `podeGerenciar ? ... : undefined`)

