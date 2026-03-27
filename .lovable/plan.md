

## Plano: Corrigir pedido 0142 e prevenir reaparição de pedidos carregados

### Diagnóstico
O pedido 0142 (S E E Engenharia) está com `carregamento_concluido = false` na tabela `ordens_carregamento` e `etapa_atual = 'aguardando_coleta'`. A conclusão do carregamento aparentemente não foi salva. Isso pode ter ocorrido por falha na chamada RPC ou por o usuário não ter completado o fluxo de confirmação.

### Correções

**1. Migration para corrigir dados do pedido 0142**
- Atualizar `ordens_carregamento` (id `0dbbf6bb-3f36-40bc-bfb2-46a3892dcaaf`): `carregamento_concluido = true`, `carregamento_concluido_em = now()`
- Atualizar `pedidos_producao` (id `ef4875b6-9a8e-4094-97f6-efd206265ce0`): `etapa_atual = 'finalizado'`
- Registrar saída da etapa `aguardando_coleta` e entrada na etapa `finalizado` em `pedidos_etapas`

**2. Filtro defensivo no hook `useOrdensCarregamentoUnificadas.ts`**
- Na seção de ordens de carregamento (entregas), além de filtrar `etapa !== 'finalizado'`, também excluir pedidos cujo `etapa_atual` esteja em `['instalacoes', 'correcoes']` — pois se o pedido já avançou para essas etapas, o carregamento da entrega não deveria reaparecer
- Linha ~128-131: expandir o filtro para:
  ```typescript
  const etapasExcluidas = ['finalizado', 'instalacoes', 'correcoes'];
  return !etapasExcluidas.includes(etapa);
  ```

### Arquivos alterados
- Migration SQL (novo) — fix de dados do pedido 0142
- `src/hooks/useOrdensCarregamentoUnificadas.ts` — filtro defensivo por etapa

