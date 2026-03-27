

## Plano: Filtrar Ajuste de Pontuação pelo período do ranking

### Problema
A seção "Ajuste de Pontuação" mostra 71 itens de todos os tempos, sem respeitar o filtro de período (mês/ano/todos) selecionado no ranking.

### Solução
Passar o período selecionado do ranking para o hook `useAjustePontuacaoInstalacao` e filtrar pela data de criação do pedido (`pedidos_producao.created_at`).

### Alterações

**1. `src/hooks/useAjustePontuacaoInstalacao.ts`**
- Aceitar parâmetro opcional `periodo: 'mes' | 'ano' | 'todos'`
- Calcular `dataInicio` e `dataFim` com base no período (mesmo cálculo do ranking)
- Aplicar filtro de data na query: `.gte('pedidos_producao.created_at', dataInicio)` e `.lte('pedidos_producao.created_at', dataFim)`
- Adicionar `periodo` na dependência do `useEffect`

**2. `src/components/ranking/AjustePontuacaoSection.tsx`**
- Aceitar prop `periodo` no componente
- Passá-la ao hook

**3. `src/pages/logistica/RankingEquipesInstalacao.tsx`**
- Passar `periodo` à `AjustePontuacaoSection`

### Arquivos alterados
- `src/hooks/useAjustePontuacaoInstalacao.ts`
- `src/components/ranking/AjustePontuacaoSection.tsx`
- `src/pages/logistica/RankingEquipesInstalacao.tsx`

