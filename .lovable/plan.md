

## Plano: Adicionar badge de contagem de tarefas no botão "Minhas Tarefas"

### O que será feito
Adicionar um badge numérico no botão de "Minhas Tarefas" do `FloatingProfileMenu` mostrando quantas tarefas pendentes o usuário tem na semana atual.

### Alterações

#### 1. `src/hooks/useTarefasCount.ts`
Atualizar a query para filtrar tarefas da semana atual (segunda a domingo), usando `data_referencia` entre `startOfWeek` e `endOfWeek`, mantendo o filtro `status = 'em_andamento'`.

#### 2. `src/components/FloatingProfileMenu.tsx`
- Importar `useTarefasCount`
- No botão do `ClipboardList` (linha 103-108), adicionar um badge vermelho posicionado no canto superior direito (`absolute -top-1 -right-1`) com o número de tarefas, visível apenas quando `count > 0`
- Tornar o botão `relative` para posicionamento do badge

```text
┌──────────┐
│  📋  (5) │  ← badge vermelho no canto
└──────────┘
```

