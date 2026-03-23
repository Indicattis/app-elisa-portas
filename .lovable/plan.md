

## Plano: Cores condicionais no calendário de tarefas

### Lógica de cores

Baseado na `data_referencia` (dia do card) comparada com hoje:

| Status | Data | Cor | Significado |
|--------|------|-----|-------------|
| `concluida` | passado (< hoje) | Laranja | Concluída atrasada |
| `em_andamento` | passado (< hoje) | Vermelho | Não concluída e atrasada |
| `concluida` | hoje ou futuro | Verde | Concluída no prazo |
| `em_andamento` | hoje ou futuro | Neutro (atual) | Pendente, ainda no prazo |

### Alteração

**Arquivo: `src/pages/ChecklistLideranca.tsx`**

No bloco de renderização de cada tarefa (linhas ~188-226), substituir a lógica binária `isConcluida` por uma classificação em 3 estados:

```tsx
const isConcluida = tarefa.status === 'concluida';
const isAtrasada = dia < startOfDay(hoje); // dia já passado
const isConcluidaAtrasada = isConcluida && isAtrasada;
const isNaoConcluida = !isConcluida && isAtrasada;
const isConcluidaNoPrazo = isConcluida && !isAtrasada;
```

Aplicar nas seguintes propriedades:
- **Card border/bg**: vermelho (`red-500`), laranja (`amber-500`), verde (`emerald-500`) ou neutro
- **Texto da descrição**: cor correspondente ao estado
- **Ícone de status**: `CheckCircle2` verde (no prazo), `CheckCircle2` laranja (atrasada), `AlertCircle` vermelho (pendente atrasada)

Também atualizar os badges de contagem no header do dia (linhas 161-174) para refletir as 3 categorias ao invés de apenas "pendentes" e "concluídas".

Nenhum outro arquivo precisa ser alterado — a lógica de cores é puramente visual no componente de renderização.

