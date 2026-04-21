

## Padronizar cálculo de faturamento e auditar vendas de janeiro

### Diagnóstico

- A mudança "instalação como item separado" **não alterou vendas de janeiro/2026**: nenhuma delas tem item `tipo_produto='instalacao'`. Todas seguem o formato antigo (instalação embutida em `produtos_vendas.valor_instalacao` da porta).
- O valor exibido no dashboard (R$ 395.434,13) **bate com a soma real dos itens** das vendas de janeiro. A soma de `vendas.valor_venda` (R$ 423.934) inclui frete (R$ 28.500); subtraindo o frete chega-se a R$ 395.434, idêntico à soma de `produtos_vendas.valor_total`. Portanto não há perda de instalação no total.
- Os problemas reais encontrados:
  1. **Hooks divergem** sobre incluir `valor_credito`: `useFaturamentoMensal` soma; `useVendasMesAtual`, `useVendasSemanaAtual`, `useVendasAgregadas`, `useFaturamentoPorProduto`, `useAdministrativoDashboard` **não somam**. Isso faz cards diferentes mostrarem valores diferentes para o mesmo período.
  2. **Vendas-teste/rascunho** com `valor_venda` simbólico (R$ 100, R$ 130, R$ 160) entram no faturamento de janeiro: Sidnei Bizotto, Daiane Camargo, Lucas Buffon, Delmar Koch, Deliz Viagens, Adelar Schaefer, etc. (~6 vendas).
  3. Diferenças de centavos por arredondamento entre `valor_venda` e soma dos itens em ~20 vendas (irrelevantes no agregado).

### O que fazer

**1. Padronizar o cálculo de faturamento (uma única fórmula em todos os hooks)**

Definir e aplicar a fórmula canônica:

```text
faturamento_liquido = valor_venda + valor_credito - valor_frete
```

Aplicar em: `useFaturamentoMensal`, `useVendasMesAtual`, `useVendasSemanaAtual`, `useVendasAgregadas`, `useVendasDoDia` (ranking), `useRankingVendedoresDia`, `useFaturamentoPorProduto`, `useAdministrativoDashboard`. Hoje só `useFaturamentoMensal` inclui `valor_credito`.

**2. Excluir vendas-teste do faturamento**

Adicionar filtro nos hooks acima para ignorar vendas com `valor_venda < 500` (limite configurável; janeiro tem 5–6 dessas, todas claramente rascunhos). Alternativa mais segura: filtrar por uma flag explícita (`status` ou um novo campo `is_teste`), mas isso exige migração — começar pelo limite por valor.

**3. Auditar e limpar as 6 vendas-teste de janeiro**

Apresentar a lista para o usuário decidir caso a caso: deletar, marcar como cancelada, ou manter. Sem mudanças automáticas no banco até decisão.

**4. Conferir o título/rótulo dos cards**

Garantir que cards rotulados como "Faturamento" usem a fórmula canônica e cards rotulados como "Vendas Brutas" (se houver) deixem claro que incluem frete. Hoje os rótulos dizem "faturamento" mas a fórmula varia.

### Detalhes técnicos

- Criar utilitário `src/utils/faturamentoCalc.ts` exportando `calcularFaturamentoLiquido(venda)` e `VENDA_TESTE_LIMITE = 500`, e uma função `isVendaValida(venda)`.
- Substituir as expressões inline `valor_venda - valor_frete` em cada hook listado pela função utilitária.
- A mudança não toca em schema; apenas lógica de leitura.
- Recalcular: após o deploy, o card de janeiro deve cair de R$ 395.434 para algo próximo de R$ 395.434 + créditos − vendas-teste (impacto líquido pequeno, mas todos os cards passarão a bater entre si).

### Fora do escopo

- Não migrar vendas antigas de janeiro para o novo formato de instalação como item separado (não há ganho — o valor total já está correto).
- Não alterar `vendas.valor_venda` no banco.
- Não criar nova coluna `is_teste` nesta etapa.

