
## Plano: Alimentar despesas do DRE a partir da tabela `gastos`

### Contexto

Atualmente, o DRE mensal (`/direcao/dre/:mes`) busca despesas da tabela `despesas_mensais`, onde cada despesa é inserida manualmente. O objetivo é substituir essa fonte pela tabela `gastos`, que já contém os pagamentos reais registrados em `/administrativo/financeiro/gastos`.

Cada gasto tem um `tipo_custo_id` vinculado a `tipos_custos`, que possui o campo `tipo` (`fixa` ou `variavel`). Vamos agrupar os gastos por tipo de custo e mês para gerar as linhas de despesa automaticamente.

### Alteração

**`src/pages/direcao/DREMesDirecao.tsx`**

1. **Substituir `fetchDespesas`**: Em vez de consultar `despesas_mensais`, buscar da tabela `gastos` os registros do mês, fazendo join com `tipos_custos` para obter nome e tipo. Agrupar por `tipo_custo_id` somando os valores.

2. **Mapear categorias**:
   - `tipos_custos.tipo = 'fixa'` → Despesas Fixas
   - `tipos_custos.tipo = 'variavel'` → Despesas Variáveis
   - Manter Folha Salarial como despesa fixa com nome "Salários" (ou filtrar pelo nome específico)

3. **Remover funcionalidades de CRUD de despesas**: Como os dados vêm dos gastos já registrados, remover os botões de adicionar/excluir/toggle status das seções de despesa. As seções passam a ser somente leitura (read-only).

4. **Manter layout**: A estrutura visual das seções (Despesas Fixas, Folha Salarial, Despesas Variáveis) e o resumo final permanecem iguais, apenas os dados mudam de fonte.

5. **Simplificar `DespesaSection`**: Tornar read-only removendo props de `onAdd`, `onDelete`, `onToggleStatus` e os formulários inline. Exibir apenas a tabela com nome e valor.

### Detalhes técnicos

```text
gastos (data entre início e fim do mês)
  → JOIN tipos_custos ON tipo_custo_id
  → WHERE tipos_custos.aparece_no_dre = true
  → GROUP BY tipo_custo_id
  → SUM(valor) por grupo
  → Separar por tipos_custos.tipo (fixa / variavel)
```

- Folha Salarial: filtrar tipos_custos com nome contendo "Salário" ou criar uma categoria específica. Se o tipo de custo "Salários" existir como `fixa`, será listado junto com as fixas — podemos separar pelo nome.

### Arquivo alterado
- `src/pages/direcao/DREMesDirecao.tsx` (reescrita do fetch de despesas e simplificação do componente)
