

## Plano: Tela fullscreen de tarefas/missões do usuário (slide da esquerda)

### O que será feito
Adicionar um botão flutuante (ícone de checklist) ao lado do avatar de perfil no `FloatingProfileMenu`. Ao clicar, uma tela fullscreen desliza da esquerda para a direita, mostrando todas as tarefas e missões atribuídas ao usuário logado. Estilo glassmorphism igual ao da `/direcao/checklist-lideranca`, otimizado para mobile.

### Arquivos

**1. Novo: `src/components/MinhasTarefasFullscreen.tsx`**
- Recebe `open`, `onOpenChange`
- Usa `useTarefas(user.id)` para buscar tarefas do usuário logado
- Usa `useMissoes()` e filtra por `responsavel_id === user.id`
- Renderiza um painel fixo fullscreen com animação slide-in da esquerda (`translate-x` transition)
- Botão X para fechar no canto superior direito
- Duas seções verticais:
  - **Minhas Tarefas**: lista de tarefas com status (em_andamento/concluída), toggle de status, descrição, data
  - **Minhas Missões**: cards de missões com progress bar, checkboxes marcáveis, badges de atraso
- Estilo: `bg-black`, cards com `bg-white/5 border-white/10 backdrop-blur-xl`, textos brancos, gradientes azuis, mesma paleta do ChecklistLideranca
- Ao clicar numa missão, abre o `DetalhesMissaoModal` existente

**2. Editar: `src/components/FloatingProfileMenu.tsx`**
- Adicionar state `minhasTarefasOpen`
- Renderizar botão flutuante (ícone `ClipboardList`) à esquerda do avatar, com mesmo estilo glassmorphism
- Renderizar `<MinhasTarefasFullscreen>` controlado pelo state
- O botão só aparece se `userRole` existe

### Detalhes técnicos

- A tela fullscreen será um `div` fixo com `inset-0 z-[60]` e transição CSS (`transform: translateX(-100%)` → `translateX(0)`)
- Sem usar Sheet/Drawer — implementação custom para controle total do layout fullscreen
- Scroll interno via `overflow-y-auto` no conteúdo
- Toggle de tarefa usa `toggleStatus` do `useTarefas` existente
- Toggle de checkbox de missão usa `toggleCheckbox` do `useMissoes`

