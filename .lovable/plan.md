

## Plano: Integrar Programação Semanal no Checklist Liderança

### Resumo
Embutir o conteúdo da página `/dashboard/direcao/checklist/programacao` (calendário semanal de templates recorrentes) diretamente na página `/direcao/checklist-lideranca`, usando Tabs para alternar entre "Tarefas" e "Programação". Remover o botão de navegação externa.

### Alterações

**1. `src/pages/ChecklistLideranca.tsx`**
- Adicionar estado `abaPrincipal` para controlar a tab ativa ("tarefas" | "programacao")
- Importar componentes necessários: `Tabs, TabsList, TabsTrigger, TabsContent`, `Tooltip/TooltipProvider`, `Clock`, `Trash2`, `cn`
- Adicionar estados do módulo de programação: `templateParaDeletar`, `filtroResponsavel`, `modalRecorrenteAberto`
- Adicionar lógica de agrupamento `templatesPorDia` e filtro por responsável (copiada do Programação)
- Substituir o botão "Programação" por uma tab no layout
- Na tab "Programação": renderizar o grid de 7 colunas com os templates agrupados por dia da semana, incluindo filtro de responsável e botão "Nova Recorrente"
- Na tab "Tarefas": manter todo o conteúdo atual (calendário semanal, filtros, tabela)
- Adicionar o `AlertDialog` de confirmação de deleção de template
- Adicionar o `NovaRecorrenteModal` (importar de `@/components/todo/NovaRecorrenteModal`)

**2. Remoção da rota antiga (opcional)**
- Remover ou manter a rota `/dashboard/direcao/checklist/programacao` como redirect — a critério do usuário

### Estrutura visual

```text
┌─────────────────────────────────────────────┐
│ Checklist Liderança                         │
│ [Setor ▼]           [Recorrentes] [+ Tarefa]│
│                                             │
│  ┌──────────┐ ┌──────────────┐              │
│  │ Tarefas  │ │ Programação  │   ← Tabs     │
│  └──────────┘ └──────────────┘              │
│                                             │
│  (conteúdo da tab ativa)                    │
└─────────────────────────────────────────────┘
```

### Arquivo impactado
- `src/pages/ChecklistLideranca.tsx`

