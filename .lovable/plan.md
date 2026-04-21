

## Auto-faturar produtos de instalação em 40%

### Causa

Em `/administrativo/financeiro/faturamento/:id`, produtos do tipo `instalacao` já têm o lucro pré-preenchido em 40% via `useEffect`, mas o campo `faturamento` permanece `false` — então a coluna **Status** mostra "Pendente" e o item só é marcado como Faturado quando o usuário clica em "Faturar Venda".

Validação no banco para a venda `24b971b0-...`: as 2 instalações têm `lucro_item = 920` (40% de R$ 2.300) mas `faturamento = false`.

### Mudança

No `useEffect` de auto-faturamento de instalação em `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` (linhas 542–567), além de gravar `lucro_item` e `custo_producao`, também gravar `faturamento = true` no `produtos_vendas`.

Para isso, atualizar a mutation `updateLucroItem` em `src/hooks/useProdutosVenda.ts` para aceitar um parâmetro opcional `faturamento` (default `undefined`, mantendo o comportamento atual de portas e pintura).

```text
useEffect instalacao
   └─ updateLucroItem({ produtoId, lucroItem, custoProducao, faturamento: true })
         └─ UPDATE produtos_vendas SET lucro_item, custo_producao, faturamento = true
```

Resultado: ao abrir a tela de faturamento, instalações aparecem direto com badge "Faturado" (verde) sem ação manual, igual portas/pintura passam a "Tabela"/"Fórmula" automaticamente — mas instalação vai além e já marca o `faturamento = true`.

### Fora de escopo

- Não altera lógica de portas (`porta_enrolar`) nem pintura (`pintura_epoxi`) — continuam com badge "Tabela"/"Fórmula" e `faturamento = false` até o "Faturar Venda".
- Não altera o cálculo do excedente nem o lucro total da venda.
- Não altera RLS nem migrações.

### Arquivos

- `src/hooks/useProdutosVenda.ts` — adicionar campo opcional `faturamento` à mutation `updateLucroItem`.
- `src/pages/administrativo/FaturamentoVendaMinimalista.tsx` — passar `faturamento: true` no auto-faturamento de instalação.

