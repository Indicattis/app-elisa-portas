

## Plano: Refazer layout do Checklist Liderança

### Resumo
Reescrever `ChecklistLideranca.tsx` usando o `MinimalistLayout` (mesmo padrão da Frota), removendo filtro de setor e card de responsável, e separando Tarefas e Programação em duas seções visíveis simultaneamente (sem tabs).

### Alterações em `src/pages/ChecklistLideranca.tsx`

**1. Usar MinimalistLayout como wrapper**
- Remover layout manual (botão voltar, header, container)
- Usar `MinimalistLayout` com `backPath="/direcao"` e breadcrumb:
  ```
  Home > Direção > Checklist Liderança
  ```
- Botões de ação no `headerActions` (Recorrentes, Nova Tarefa, Nova Recorrente) com estilo blue gradient igual à Frota

**2. Remover elementos**
- Select de setor (`setor` state e `SETOR_LABELS`)
- Card "Responsável pelo Setor" (`responsavelSetor`, `useSetorInfo`)
- Imports não usados: `SETOR_LABELS`, `useSetorInfo`, `ROLE_LABELS`, `ArrowLeft`

**3. Dividir Tarefas e Programação em seções separadas (não tabs)**
- Remover `Tabs/TabsList/TabsTrigger/TabsContent`
- Renderizar ambas as seções em sequência vertical:
  - **Seção 1: Tarefas da Semana** — badges de resumo, calendário semanal, filtros, tabela com navegação de semana
  - **Seção 2: Programação Semanal** — filtro de responsável, grid de 7 colunas com templates
- Cada seção com um título/header visual separado (Card ou heading)

**4. Estilo dark/glass (padrão MinimalistLayout)**
- Cards: `bg-white/5 border-blue-500/10 backdrop-blur-xl`
- Textos: `text-white`, `text-white/60`
- Badges: `bg-blue-500/10`, `border-blue-500/20`
- Botões: gradientes blue como na Frota
- Spinner de loading: `border-blue-400`

### Estrutura visual

```text
┌─ AnimatedBreadcrumb: Home > Direção > Checklist Liderança ─┐
│                                                             │
│ [← Back]   Checklist Liderança          [Recorrentes] [+]  │
│            Gerencie tarefas semanais                        │
│                                                             │
│ ┌─ Tarefas da Semana ─────────────────────────────────────┐ │
│ │ 5 pendentes  3 concluídas                               │ │
│ │ [CalendarioSemanal]                                     │ │
│ │ [Filtros]                                               │ │
│ │ [← Anterior]  01 Jan - 07 Jan  [Próxima →]             │ │
│ │ [TarefasTabela]                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Programação Semanal ──────────────────────────────────┐  │
│ │ [Filtro responsável ▼]  12 templates                   │  │
│ │ ┌─Dom─┐┌─Seg─┐┌─Ter─┐┌─Qua─┐┌─Qui─┐┌─Sex─┐┌─Sab─┐   │  │
│ │ │     ││     ││     ││     ││     ││     ││     │   │  │
│ │ └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘   │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Arquivo impactado
- `src/pages/ChecklistLideranca.tsx` (reescrita completa)

