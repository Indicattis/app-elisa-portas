
Diagnóstico confirmado para a venda `f1634106-e5eb-45fc-bfe3-59e3dfe01125`:
- Banco: `frete_aprovado = true`, `custo_total = 0`, e todos os itens em `produtos_vendas` com `faturamento = true`.
- Portanto, ela está faturada no critério funcional atual.
- O motivo de aparecer como pendente é que ainda existe outra regra antiga na listagem de faturamento (`FaturamentoVendasMinimalista`) exigindo `custo_total > 0`.

Plano de correção (curto e direto):
1. Padronizar a regra de status de faturamento em um helper único (ex.: `isVendaFaturada`), com o critério:
   - tem itens,
   - `frete_aprovado === true`,
   - todos os itens com `faturamento === true`.
   - sem depender de `custo_total > 0`.

2. Aplicar esse helper nos pontos que ainda usam a regra antiga:
   - `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` (principal origem do problema reportado).
   - `src/pages/Faturamento.tsx` (evitar inconsistência na versão legada da tela).

3. Revisar consistência nos indicadores da tela (cards “Faturadas/Pendentes”, filtro por status e ordenação por faturamento), já que todos dependem da mesma função `isFaturada`.

4. Validação pós-ajuste (com os 2 IDs já reportados):
   - `c3c2400b-2891-45e1-970d-98d67c9f2e3b`
   - `f1634106-e5eb-45fc-bfe3-59e3dfe01125`
   Resultado esperado: ambas saem de “pendentes” e passam para “faturadas” nas listagens.

Arquivos impactados:
- Novo: `src/lib/faturamentoStatus.ts` (helper compartilhado)
- Editar: `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`
- Editar: `src/pages/Faturamento.tsx`
